import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';

/**
 * POST /api/partner/documents/bulk
 * 
 * Perform bulk operations on documents.
 * 
 * Request Body:
 * - action: 'verify' | 'reject' | 'download'
 * - document_ids: string[] (array of document IDs)
 * - rejection_reason?: string (required if action is 'reject')
 */
export async function POST(request: NextRequest) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const body = await request.json();
    const { action, document_ids, rejection_reason } = body;

    // Validate action
    if (!['verify', 'reject', 'download'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "verify", "reject", or "download"' 
      }, { status: 400 });
    }

    // Validate document IDs
    if (!Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json({ 
        error: 'Document IDs must be a non-empty array' 
      }, { status: 400 });
    }

    // Require rejection reason when rejecting
    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json({ 
        error: 'Rejection reason is required when rejecting documents' 
      }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Fetch documents and verify access
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select(`
        id,
        student_id,
        type,
        file_name,
        file_key,
        status,
        students (
          id,
          user_id,
          first_name,
          last_name
        )
      `)
      .in('id', document_ids);

    if (fetchError) {
      console.error('Error fetching documents:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
    }

    if (!documents || documents.length === 0) {
      return NextResponse.json({ error: 'No documents found' }, { status: 404 });
    }

    // Verify partner has access to all documents
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    const accessibleDocumentIds: string[] = [];

    for (const doc of documents) {
      const studentData = doc.students && !Array.isArray(doc.students) ? doc.students : null;
      if (studentData?.user_id) {
        const { data: studentUser } = await supabase
          .from('users')
          .select('referred_by_partner_id')
          .eq('id', studentData.user_id)
          .maybeSingle();
        
        let hasAccess = false;
        
        if (isAdmin) {
          const { data: teamMembers } = await supabase
            .from('users')
            .select('id')
            .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
            .eq('role', 'partner');
          
          const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
          hasAccess = teamUserIds.includes(studentUser?.referred_by_partner_id || '');
        } else {
          hasAccess = studentUser?.referred_by_partner_id === partnerUser.id;
        }
        
        if (hasAccess) {
          accessibleDocumentIds.push(doc.id);
        }
      }
    }

    if (accessibleDocumentIds.length === 0) {
      return NextResponse.json({ 
        error: 'Access denied. You do not have access to any of the specified documents.' 
      }, { status: 403 });
    }

    // Perform bulk operation
    let result;

    switch (action) {
      case 'verify':
        result = await supabase
          .from('documents')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by: partnerUser.id,
            rejection_reason: null,
            updated_at: new Date().toISOString()
          })
          .in('id', accessibleDocumentIds)
          .select('id, type, file_name, status');
        break;

      case 'reject':
        result = await supabase
          .from('documents')
          .update({
            status: 'rejected',
            verified_at: new Date().toISOString(),
            verified_by: partnerUser.id,
            rejection_reason,
            updated_at: new Date().toISOString()
          })
          .in('id', accessibleDocumentIds)
          .select('id, type, file_name, status');
        break;

      case 'download':
        // Generate signed URLs for all documents
        const downloadUrls = await Promise.all(
          documents
            .filter(d => accessibleDocumentIds.includes(d.id) && d.file_key)
            .map(async (doc) => {
              const { data: signedUrlData } = await supabase
                .storage
                .from('documents')
                .createSignedUrl(doc.file_key!, 3600);
              
              return {
                id: doc.id,
                file_name: doc.file_name,
                url: signedUrlData?.signedUrl || null
              };
            })
        );

        return NextResponse.json({
          action: 'download',
          documents: downloadUrls,
          total: downloadUrls.length
        });
    }

    if (result?.error) {
      console.error('Error in bulk operation:', result.error);
      return NextResponse.json({ 
        error: `Failed to ${action} documents` 
      }, { status: 500 });
    }

    // Log activity for each document (optional, won't fail if RPC doesn't exist)
    try {
      for (const docId of accessibleDocumentIds) {
        await supabase
          .rpc('log_activity', {
            p_entity_type: 'document',
            p_entity_id: docId,
            p_action: action === 'verify' ? 'document_verified' : 'document_rejected',
            p_actor_id: partnerUser.id,
            p_metadata: {
              bulk_operation: true,
              total_documents: accessibleDocumentIds.length,
              rejection_reason: action === 'reject' ? rejection_reason : null
            }
          });
      }
    } catch (logError) {
      console.error('Error logging activity (non-critical):', logError);
      // Don't fail the request if logging fails
    }

    // Create notifications for affected students
    const affectedStudents = new Map<string, { userId: string; count: number }>();
    
    documents?.forEach(doc => {
      const studentData = doc.students && !Array.isArray(doc.students) ? doc.students : null;
      if (accessibleDocumentIds.includes(doc.id) && studentData?.user_id) {
        const userId = studentData.user_id;
        if (!affectedStudents.has(userId)) {
          affectedStudents.set(userId, { userId, count: 0 });
        }
        affectedStudents.get(userId)!.count++;
      }
    });

    for (const [userId, data] of affectedStudents) {
      try {
        await supabase
          .from('document_notifications')
          .insert({
            user_id: userId,
            type: action === 'verify' ? 'document_verified' : 'document_rejected',
            title: action === 'verify' 
              ? 'Documents Verified' 
              : 'Documents Rejected',
            message: action === 'verify'
              ? `${data.count} of your documents have been verified.`
              : `${data.count} of your documents were rejected: ${rejection_reason}`,
            metadata: {
              bulk_operation: true,
              count: data.count,
              rejection_reason: action === 'reject' ? rejection_reason : null
            }
          });
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    }

    return NextResponse.json({
      action,
      documents: result?.data || [],
      total: accessibleDocumentIds.length,
      skipped: document_ids.length - accessibleDocumentIds.length,
      message: `Successfully ${action === 'verify' ? 'verified' : 'rejected'} ${accessibleDocumentIds.length} documents`
    });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
