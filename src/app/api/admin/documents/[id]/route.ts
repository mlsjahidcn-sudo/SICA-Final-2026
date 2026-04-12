import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET - Get document details for admin review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'admin' && authUser.role !== 'partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: document, error } = await supabase
      .from('application_documents')
      .select(`
        id,
        application_id,
        document_type,
        file_key,
        file_name,
        file_size,
        content_type,
        status,
        rejection_reason,
        uploaded_at,
        verified_at,
        verified_by,
        created_at,
        updated_at,
        applications (
          id,
          status,
          student_id,
          program_id,
          students (
            id,
            first_name,
            last_name,
            email
          ),
          programs (
            id,
            name,
            universities (
              id,
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

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update document status (verify/reject)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (authUser.role !== 'admin' && authUser.role !== 'partner') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejection_reason } = body;

    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "verified" or "rejected"' 
      }, { status: 400 });
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required when rejecting a document' 
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Update document status
    const updateData: Record<string, unknown> = {
      status,
      verified_at: new Date().toISOString(),
      verified_by: authUser.id,
      updated_at: new Date().toISOString(),
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason;
    } else {
      updateData.rejection_reason = null;
    }

    const { data: document, error } = await supabase
      .from('application_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating document:', error);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    // Check if all documents for this application are verified
    const { data: allDocs } = await supabase
      .from('application_documents')
      .select('status')
      .eq('application_id', document.application_id);

    const allVerified = allDocs?.every(d => d.status === 'verified');

    // Send notification to student about document verification
    // This would be a good place to trigger a notification

    return NextResponse.json({ 
      document,
      all_documents_verified: allVerified
    });
  } catch (error) {
    console.error('Error in document PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
