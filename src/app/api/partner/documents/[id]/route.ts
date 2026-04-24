import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner/roles';

/**
 * GET /api/partner/documents/[id]
 * 
 * Get a single document by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const supabase = getSupabaseClient();
    const documentId = (await params).id;

    // Fetch document
    const { data: document, error } = await supabase
      .from('documents')
      .select(`
        *,
        students (
          id,
          first_name,
          last_name,
          email,
          user_id
        )
      `)
      .eq('id', documentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching document:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify access
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    const student = document.students && !Array.isArray(document.students) 
      ? document.students 
      : null;

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get student's user info
    const { data: studentUser } = await supabase
      .from('users')
      .select('id, referred_by_partner_id')
      .eq('id', student.user_id)
      .single();

    if (!studentUser) {
      return NextResponse.json({ error: 'Student user not found' }, { status: 404 });
    }

    // Verify access
    if (!isAdmin) {
      if (studentUser.referred_by_partner_id !== partnerUser.id) {
        return NextResponse.json(
          { error: 'You do not have access to this document' },
          { status: 403 }
        );
      }
    } else {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
        .eq('role', 'partner');
      
      const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
      
      if (!teamUserIds.includes(studentUser.referred_by_partner_id)) {
        return NextResponse.json(
          { error: 'You do not have access to this document' },
          { status: 403 }
        );
      }
    }

    // Generate signed URL
    let url = null;
    if (document.file_key) {
      const { data: signedUrlData } = await supabase
        .storage
        .from('documents')
        .createSignedUrl(document.file_key, 3600);
      
      url = signedUrlData?.signedUrl || null;
    }

    return NextResponse.json({
      document: {
        ...document,
        url,
        student: {
          id: student.id,
          name: `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Unknown Student',
          email: student.email,
        },
      },
    });
  } catch (error) {
    console.error('Error in GET document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/partner/documents/[id]
 * 
 * Update document metadata.
 * 
 * Request body:
 * - type: Document type (optional)
 * - expires_at: Expiration date ISO string (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const supabase = getSupabaseClient();
    const documentId = (await params).id;

    const body = await request.json();
    const { type, expires_at } = body;

    // Fetch document to verify access
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select(`
        id,
        uploaded_by,
        students (
          id,
          user_id
        )
      `)
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify access
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    // Only uploader or admin can update
    if (document.uploaded_by !== partnerUser.id && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to update this document' },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (type !== undefined) {
      updates.type = type;
    }

    if (expires_at !== undefined) {
      updates.expires_at = expires_at || null;
    }

    // Update document
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update(updates)
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json(
        { error: 'Failed to update document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Document updated successfully',
      document: updatedDoc,
    });
  } catch (error) {
    console.error('Error in PUT document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/partner/documents/[id]
 * 
 * Delete a document.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const supabase = getSupabaseClient();
    const documentId = (await params).id;

    // Fetch document to verify access
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, file_key, uploaded_by')
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify access
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    // Only uploader or admin can delete
    if (document.uploaded_by !== partnerUser.id && !isAdmin) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this document' },
        { status: 403 }
      );
    }

    // Delete file from storage
    if (document.file_key) {
      const { error: storageError } = await supabase
        .storage
        .from('documents')
        .remove([document.file_key]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Delete document record
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Error deleting document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE document:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
