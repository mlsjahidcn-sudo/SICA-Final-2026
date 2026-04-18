import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';

// DELETE /api/partner/profile/documents/[id] - Delete partner's own document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get document and verify ownership
    const { data: document } = await supabase
      .from('documents')
      .select('id, file_key, uploaded_by, student_id')
      .eq('id', id)
      .maybeSingle();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify document belongs to this partner (uploaded_by check) and is not a student document
    if (document.uploaded_by !== user.id || document.student_id !== null) {
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
    }

    // Delete document record
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting partner document:', error);
      return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Document deleted' });

  } catch (error) {
    console.error('Error in partner document DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
