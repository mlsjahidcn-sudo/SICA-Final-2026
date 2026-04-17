import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';
import { sendNotificationToUser } from '@/ws-handlers/notifications';

/**
 * PATCH /api/admin/documents/[id]/verify
 * 
 * Verify or reject a document (using the unified `documents` table)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrResponse = await verifyAdmin(request);
    if (userOrResponse instanceof NextResponse) {
      return userOrResponse;
    }

    const adminUser = userOrResponse;
    const documentId = (await params).id;
    const supabase = getSupabaseClient();
    
    const body = await request.json();
    const { status, rejection_reason } = body;

    if (!status || !['verified', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "verified" or "rejected".' },
        { status: 400 }
      );
    }

    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting a document.' },
        { status: 400 }
      );
    }

    // Get the document to find the student
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, student_id, type, file_name, status')
      .eq('id', documentId)
      .single();

    if (fetchError || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    // Update document status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason;
    } else {
      updateData.rejection_reason = null; // Clear rejection reason if verified
    }

    const { error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId);

    if (updateError) {
      console.error('Error updating document status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document status' },
        { status: 500 }
      );
    }

    // Fetch the student's user_id to send a notification
    const { data: student } = await supabase
      .from('students')
      .select('user_id, first_name, last_name')
      .eq('id', document.student_id)
      .single();

    if (student?.user_id) {
      // Create a notification
      const title = status === 'verified' 
        ? 'Document Verified' 
        : 'Document Rejected';
      
      const content = status === 'verified'
        ? `Your document "${document.file_name || document.type}" has been verified.`
        : `Your document "${document.file_name || document.type}" has been rejected. Reason: ${rejection_reason}`;

      await supabase.from('notifications').insert({
        user_id: student.user_id,
        title,
        content,
        type: 'document',
        link: `/student-v2/documents`,
      });

      // Send realtime notification
      try {
        await sendNotificationToUser(student.user_id, {
          title,
          message: content,
          type: 'document_update',
          metadata: {
            documentId: document.id,
            status,
            type: document.type,
          }
        });
      } catch (wsError) {
        console.error('Failed to send WebSocket notification:', wsError);
        // Continue even if WS fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Document successfully ${status}`,
      document: {
        ...document,
        ...updateData
      }
    });
  } catch (error) {
    console.error('Error in admin document verify API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}