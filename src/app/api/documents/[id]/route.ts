import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';
import { DOCUMENT_TYPES, normalizeDocumentType } from '@/lib/document-types';

/**
 * Check if a partner user can access a specific application.
 * - Admin: can access any application belonging to their partner org OR students referred by team members
 * - Member: can only access applications for students they personally referred
 */
async function canPartnerAccessApplication(
  partnerUser: { id: string; partner_role: string | null; partner_id: string | null },
  applicationStudentId: string,
  applicationPartnerId: string | null,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<boolean> {
  const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';

  if (isAdmin) {
    // Admin can access apps from their partner org
    if (applicationPartnerId) {
      const { data: partnerRecords } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', partnerUser.id);
      const partnerIds = (partnerRecords || []).map(r => r.id);
      if (partnerIds.includes(applicationPartnerId)) {
        return true;
      }
    }
    // Admin can also access apps for students referred by any team member
    const { data: studentRec } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', applicationStudentId)
      .maybeSingle();
    
    if (studentRec?.user_id) {
      const { data: userRec } = await supabase
        .from('users')
        .select('referred_by_partner_id')
        .eq('id', studentRec.user_id)
        .maybeSingle();
      
      if (userRec?.referred_by_partner_id) {
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
          .eq('role', 'partner');
        const teamIds = (teamMembers || []).map(m => m.id);
        if (!teamIds.includes(partnerUser.id)) teamIds.push(partnerUser.id);
        return teamIds.includes(userRec.referred_by_partner_id);
      }
    }
    return false;
  } else {
    // Member can only access apps for students they personally referred
    const { data: studentRec } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', applicationStudentId)
      .maybeSingle();
    
    if (studentRec?.user_id) {
      const { data: userRec } = await supabase
        .from('users')
        .select('referred_by_partner_id')
        .eq('id', studentRec.user_id)
        .maybeSingle();
      return userRec?.referred_by_partner_id === partnerUser.id;
    }
    return false;
  }
}

// GET /api/documents/[id] - Get single document details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Get document with application info
    const { data: doc, error: docError } = await supabase
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
        created_at,
        updated_at,
        applications (
          student_id,
          partner_id,
          programs (
            name,
            universities (
              name_en
            )
          )
        )
      `)
      .eq('id', id)
      .single();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appData = doc.applications as any;
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === appData.student_id;
    } else if (authUser.role === 'partner') {
      const partnerAuthResult = await verifyPartnerAuth(request);
      if ('error' in partnerAuthResult) {
        return partnerAuthResult.error;
      }
      isOwner = await canPartnerAccessApplication(
        partnerAuthResult.user,
        appData.student_id,
        appData.partner_id,
        supabase
      );
    }

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Error in document GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/documents/[id] - Update document metadata
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await verifyAuthToken(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Get document and verify ownership
    const { data: docRecord, error: docError } = await supabase
      .from('application_documents')
      .select(`
        id,
        file_key,
        application_id,
        applications!inner(student_id, partner_id)
      `)
      .eq('id', id)
      .single();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check ownership
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appData = docRecord.applications as any;
    let isOwner = false;
    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === appData.student_id;
    } else if (authUser.role === 'partner') {
      const partnerAuthResult = await verifyPartnerAuth(request);
      if ('error' in partnerAuthResult) {
        return partnerAuthResult.error;
      }
      isOwner = await canPartnerAccessApplication(
        partnerAuthResult.user,
        appData.student_id,
        appData.partner_id,
        supabase
      );
    }

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Allow updating document_type
    if (body.document_type !== undefined) {
      const normalizedType = normalizeDocumentType(body.document_type);
      
      if (!DOCUMENT_TYPES[normalizedType]) {
        return NextResponse.json({ 
          error: 'Invalid document type',
          allowed_types: Object.keys(DOCUMENT_TYPES)
        }, { status: 400 });
      }
      
      updateData.document_type = normalizedType;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json({ 
        message: 'No changes to update',
        document: docRecord 
      });
    }

    // Update document
    const { data: updatedDoc, error: updateError } = await supabase
      .from('application_documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
    }

    return NextResponse.json({ 
      document: updatedDoc,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Error in document PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
