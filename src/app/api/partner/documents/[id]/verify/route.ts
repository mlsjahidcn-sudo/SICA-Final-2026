import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner/roles';

/**
 * PATCH /api/partner/documents/[id]/verify
 * 
 * Allows partners to verify or reject documents.
 * 
 * Request Body:
 * - status: 'verified' | 'rejected'
 * - rejection_reason?: string (required if status is 'rejected')
 * - expires_at?: string (ISO 8601 date, optional, for time-sensitive documents)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const { id: documentId } = await params;
    const body = await request.json();
    const { status, rejection_reason, expires_at } = body;

    // Validate status
    if (!['verified', 'rejected'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be "verified" or "rejected"' 
      }, { status: 400 });
    }

    // Require rejection reason when rejecting
    if (status === 'rejected' && !rejection_reason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required when rejecting a document' 
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get document with student info
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select(`
        id,
        student_id,
        type,
        file_name,
        status,
        students (
          id,
          user_id,
          first_name,
          last_name
        )
      `)
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify partner has access to this student
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    let hasAccess = false;
    
    const studentData: any = document.students && !Array.isArray(document.students) ? document.students : (Array.isArray(document.students) ? document.students[0] : null);
    
    if (studentData?.user_id) {
      // Check if partner referred this student or is admin with team access
      const { data: studentUser } = await supabase
        .from('users')
        .select('referred_by_partner_id')
        .eq('id', studentData.user_id)
        .maybeSingle();
      
      if (isAdmin) {
        // Admin can access students referred by themselves or team members
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
          .eq('role', 'partner');
        
        const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
        hasAccess = teamUserIds.includes(studentUser?.referred_by_partner_id || '');
      } else {
        // Member can only access students they personally referred
        hasAccess = studentUser?.referred_by_partner_id === partnerUser.id;
      }
    }

    if (!hasAccess) {
      return NextResponse.json({ 
        error: 'Access denied. You can only verify documents for students you referred.' 
      }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      status,
      verified_at: new Date().toISOString(),
      verified_by: partnerUser.id,
      updated_at: new Date().toISOString(),
    };

    if (status === 'rejected') {
      updateData.rejection_reason = rejection_reason;
    } else {
      updateData.rejection_reason = null;
    }

    // Update expiry date if provided
    if (expires_at !== undefined) {
      updateData.expires_at = expires_at;
    }

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    // Log activity
    const { error: logError } = await supabase
      .rpc('log_activity', {
        p_entity_type: 'document',
        p_entity_id: documentId,
        p_action: status === 'verified' ? 'document_verified' : 'document_rejected',
        p_actor_id: partnerUser.id,
        p_metadata: {
          document_type: document.type,
          file_name: document.file_name,
          student_id: document.student_id,
          student_name: studentData ? 
            `${studentData.first_name || ''} ${studentData.last_name || ''}`.trim() : null,
          rejection_reason: status === 'rejected' ? rejection_reason : null
        }
      });

    if (logError) {
      console.error('Error logging activity:', logError);
      // Don't fail the request if logging fails
    }

    // Create notification for student (if notification system is integrated)
    try {
      if (studentData?.user_id) {
        await supabase
          .from('document_notifications')
          .insert({
            user_id: studentData.user_id,
            type: status === 'verified' ? 'document_verified' : 'document_rejected',
            document_id: documentId,
            title: status === 'verified' 
              ? 'Document Verified' 
              : 'Document Rejected',
            message: status === 'verified'
              ? `Your ${document.type} has been verified.`
              : `Your ${document.type} was rejected: ${rejection_reason}`,
            metadata: {
              document_type: document.type,
              file_name: document.file_name,
              rejection_reason: status === 'rejected' ? rejection_reason : null
            }
          });
      }
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json({ 
      document: updatedDocument,
      message: `Document ${status === 'verified' ? 'verified' : 'rejected'} successfully`
    });
  } catch (error) {
    console.error('Error in document verify PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
