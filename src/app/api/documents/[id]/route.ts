import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';
import { DOCUMENT_TYPES, normalizeDocumentType } from '@/lib/document-types';

/**
 * Check if a partner user can access a specific student's document.
 * Uses the unified `documents` table (student-centric).
 */
async function canPartnerAccessDocument(
  partnerUser: { id: string; partner_role: string | null },
  studentUserId: string,
  supabase: ReturnType<typeof getSupabaseClient>
): Promise<boolean> {
  const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';

  const { data: userRec } = await supabase
    .from('users')
    .select('referred_by_partner_id')
    .eq('id', studentUserId)
    .maybeSingle();

  if (!userRec?.referred_by_partner_id) return false;

  if (!isAdmin) {
    // Member can only access their own referrals
    return userRec.referred_by_partner_id === partnerUser.id;
  }

  // Admin can access students referred by themselves or team members
  const { data: teamMembers } = await supabase
    .from('users')
    .select('id')
    .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
    .eq('role', 'partner');

  const teamIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
  return teamIds.includes(userRec.referred_by_partner_id);
}

// GET /api/documents/[id] - Get single document details (unified documents table)
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

    // Query the unified documents table
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .select(`
        *,
        students (
          id,
          user_id,
          first_name,
          last_name
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Verify ownership based on role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const studentData = doc.students as any;
    let isOwner = false;

    if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === doc.student_id;
    } else if (authUser.role === 'partner') {
      const partnerAuthResult = await verifyPartnerAuth(request);
      if ('error' in partnerAuthResult) {
        return partnerAuthResult.error;
      }
      if (studentData?.user_id) {
        isOwner = await canPartnerAccessDocument(
          partnerAuthResult.user,
          studentData.user_id,
          supabase
        );
      }
    }
    // Admin always has access

    if (!isOwner && authUser.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ document: doc });
  } catch (error) {
    console.error('Error in document GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/documents/[id] - Update document metadata (unified documents table)
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

    // Get document from unified documents table and verify ownership
    const { data: docRecord, error: docError } = await supabase
      .from('documents')
      .select(`
        id,
        type,
        file_key,
        uploaded_by,
        student_id,
        students (
          user_id
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (docError || !docRecord) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check ownership
    let isOwner = false;

    if (authUser.role === 'admin') {
      isOwner = true;
    } else if (authUser.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', authUser.id)
        .maybeSingle();
      isOwner = studentRecord?.id === docRecord.student_id;
    } else if (authUser.role === 'partner') {
      const partnerAuthResult = await verifyPartnerAuth(request);
      if ('error' in partnerAuthResult) {
        return partnerAuthResult.error;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentData = docRecord.students as any;
      if (studentData?.user_id) {
        isOwner = await canPartnerAccessDocument(
          partnerAuthResult.user,
          studentData.user_id,
          supabase
        );
      }
      // Also allow uploader or admin to update
      if (!isOwner && (docRecord.uploaded_by === partnerAuthResult.user.id ||
          !partnerAuthResult.user.partner_role || partnerAuthResult.user.partner_role === 'partner_admin')) {
        isOwner = true;
      }
    }

    if (!isOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Allow updating type
    if (body.type !== undefined) {
      const normalizedType = normalizeDocumentType(body.type);

      if (!DOCUMENT_TYPES[normalizedType]) {
        return NextResponse.json({
          error: 'Invalid document type',
          allowed_types: Object.keys(DOCUMENT_TYPES)
        }, { status: 400 });
      }

      updateData.type = normalizedType;
    }

    // Allow updating expires_at
    if (body.expires_at !== undefined) {
      updateData.expires_at = body.expires_at || null;
    }

    // Allow clearing rejection_reason when re-uploading
    if (body.rejection_reason !== undefined) {
      updateData.rejection_reason = body.rejection_reason;
    }

    // Only update if there are changes beyond updated_at
    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({
        message: 'No changes to update',
        document: docRecord
      });
    }

    // Update document in the unified documents table
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

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
