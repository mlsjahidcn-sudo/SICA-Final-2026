import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/documents/[id] - Get document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // applications.student_id references students.id, NOT users.id
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const { data: document, error } = await supabase
      .from('application_documents')
      .select(`
        id,
        document_type,
        status,
        file_key,
        file_url,
        file_name,
        file_size,
        content_type,
        rejection_reason,
        uploaded_at,
        created_at,
        updated_at,
        applications (
          id,
          student_id,
          programs (
            id,
            name_en,
            universities (
              name_en
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify document belongs to user (compare students.id, not users.id)
    const appData = document.applications as unknown as { student_id: string } | null;
    if (!appData || appData.student_id !== studentRecord.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Generate URL from Supabase Storage
    let url = null;
    if (document.file_key) {
      const { data: urlData } = supabase
        .storage
        .from('documents')
        .getPublicUrl(document.file_key);
      url = urlData?.publicUrl || null;
    } else if (document.file_url) {
      url = document.file_url;
    }

    return NextResponse.json({ document: { ...document, url } });

  } catch (error) {
    console.error('Error in document GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/student/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // applications.student_id references students.id, NOT users.id
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // Get document
    const { data: document } = await supabase
      .from('application_documents')
      .select(`
        id,
        file_key,
        file_url,
        applications (
          student_id
        )
      `)
      .eq('id', id)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify document belongs to user (compare students.id, not users.id)
    const appData = document.applications as unknown as { student_id: string } | null;
    if (!appData || appData.student_id !== studentRecord.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete file from Supabase Storage
    if (document.file_key) {
      try {
        await supabase.storage.from('documents').remove([document.file_key]);
      } catch (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    } else if (document.file_url) {
      // Legacy: try to extract path from URL for deletion
      try {
        const urlParts = document.file_url.split('/documents/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1].split('?')[0]; // Remove query params
          await supabase.storage.from('documents').remove([filePath]);
        }
      } catch {
        // Ignore deletion errors for legacy files
      }
    }

    // Delete document record
    const { error } = await supabase
      .from('application_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted' });

  } catch (error) {
    console.error('Error in document DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
