import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';

/**
 * Check if a partner user can access a specific application.
 * - Admin: can access any application belonging to their partner org OR students referred by team members
 * - Member: can only access applications for students they personally referred
 */
async function canPartnerAccessApplication(
  partnerUser: { id: string; partner_role: string | null; partner_id: string | null },
  applicationStudentUserId: string,
  applicationPartnerId: string | null
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';

  if (isAdmin) {
    // Admin can access apps from their partner org (applications.partner_id matches any partners.id for this user)
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
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id')
      .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
      .eq('role', 'partner');
    const teamIds = (teamMembers || []).map(m => m.id);
    if (!teamIds.includes(partnerUser.id)) teamIds.push(partnerUser.id);
    return teamIds.includes(applicationStudentUserId);
  } else {
    // Member can only access apps for students they personally referred
    return applicationStudentUserId === partnerUser.id;
  }
}

// GET /api/applications/[id] - Get a single application by ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Fetch the application first
    const { data: application, error } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        profile_snapshot,
        notes,
        priority,
        submitted_at,
        reviewed_at,
        created_at,
        updated_at,
        program_id,
        student_id,
        partner_id,
        programs (
          id,
          name,
          degree_level,
          category,
          language,
          duration_years,
          tuition_fee_per_year,
          currency,
          scholarship_coverage,
          universities (
            id,
            name_en,
            name_cn,
            city,
            province,
            logo_url,
            website_url
          )
        ),
        students (
          id,
          user_id,
          first_name,
          last_name,
          nationality,
          date_of_birth,
          gender,
          email,
          phone,
          current_address,
          highest_education,
          institution_name,
          gpa,
          hsk_level,
          ielts_score,
          toefl_score,
          passport_number,
          users (
            id,
            full_name,
            email,
            referred_by_partner_id
          )
        ),
        application_documents (
          id,
          document_type,
          file_name,
          file_size,
          content_type,
          status,
          rejection_reason,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Access control check
    if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!studentRec || application.student_id !== studentRec.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'partner') {
      const authResult = await verifyPartnerAuth(request);
      if ('error' in authResult) return authResult.error;
      const partnerUser = authResult.user;

      // Get the student's referrer info for partner access control
      const studentData = Array.isArray(application.students) ? application.students[0] : application.students;
      const studentUserData = studentData?.users
        ? (Array.isArray(studentData.users) ? studentData.users[0] : studentData.users)
        : null;
      
      // Determine the student's referrer partner user ID
      let referrerUserId = '';
      if (studentUserData?.referred_by_partner_id) {
        const referrerResult = await getReferrerUserId(application.student_id, supabase);
        referrerUserId = referrerResult || '';
      } else {
        referrerUserId = studentData?.user_id || '';
      }

      const canAccess = await canPartnerAccessApplication(
        partnerUser,
        referrerUserId,
        application.partner_id
      );
      if (!canAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // Admin role: no restrictions

    // Fix relations (Supabase returns arrays for has-many)
    // Extract personal_statement, study_plan, intake from profile_snapshot for convenience
    const snapshot = application.profile_snapshot || {};
    const normalizedApplication = {
      ...application,
      personal_statement: snapshot.personal_statement || null,
      study_plan: snapshot.study_plan || null,
      intake: snapshot.intake || null,
      programs: Array.isArray(application.programs) ? application.programs[0] : application.programs,
      students: Array.isArray(application.students) ? application.students[0] : application.students,
      application_documents: Array.isArray(application.application_documents) ? application.application_documents : [],
    };

    return NextResponse.json({ application: normalizedApplication });
  } catch (error) {
    console.error('Error in applications [id] GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Get the referred_by_partner_id for a student's application.
 * This tells us which partner user referred this student.
 */
async function getReferrerUserId(studentId: string, supabase: ReturnType<typeof getSupabaseClient>): Promise<string | null> {
  const { data: studentRec } = await supabase
    .from('students')
    .select('user_id')
    .eq('id', studentId)
    .maybeSingle();
  if (!studentRec) return null;

  const { data: userRec } = await supabase
    .from('users')
    .select('referred_by_partner_id')
    .eq('id', studentRec.user_id)
    .maybeSingle();
  return userRec?.referred_by_partner_id || null;
}

// POST /api/applications/[id] - Submit an application
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // First, get the application to verify ownership
    const { data: existingApp, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, partner_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only draft applications can be submitted
    if (existingApp.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft applications can be submitted' }, { status: 400 });
    }

    // Access control check
    if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!studentRec || existingApp.student_id !== studentRec.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'partner') {
      const authResult = await verifyPartnerAuth(request);
      if ('error' in authResult) return authResult.error;
      const partnerUser = authResult.user;

      const referrerId = await getReferrerUserId(existingApp.student_id, supabase);
      const canAccess = await canPartnerAccessApplication(
        partnerUser,
        referrerId || '',
        existingApp.partner_id
      );
      if (!canAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Update application status to submitted
    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error submitting application:', updateError);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error('Error in applications [id] POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/applications/[id] - Update an application (partner/student edit)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Get the existing application
    const { data: existingApp, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, partner_id, status, program_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingApp) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Terminal statuses cannot be edited
    const terminalStatuses = ['accepted', 'rejected', 'withdrawn'];
    if (terminalStatuses.includes(existingApp.status)) {
      return NextResponse.json({ error: 'Cannot edit applications that are accepted, rejected, or withdrawn' }, { status: 400 });
    }

    // Access control check
    if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).maybeSingle();
      if (!studentRec || existingApp.student_id !== studentRec.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else if (user.role === 'partner') {
      const authResult = await verifyPartnerAuth(request);
      if ('error' in authResult) return authResult.error;
      const partnerUser = authResult.user;

      const referrerId = await getReferrerUserId(existingApp.student_id, supabase);
      const canAccess = await canPartnerAccessApplication(
        partnerUser,
        referrerId || '',
        existingApp.partner_id
      );
      if (!canAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const body = await request.json();

    // Build update data - only allow specific fields that exist in the DB
    // program_id and notes are direct columns; personal_statement/study_plan/intake go into profile_snapshot
    const allowedDirectFields = ['program_id', 'notes'];
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const field of allowedDirectFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Priority is an integer field (0=normal, 1=low, 2=high, 3=urgent)
    if (body.priority !== undefined) {
      if (typeof body.priority === 'number') {
        updateData.priority = body.priority;
      } else {
        const priorityMap: Record<string, number> = { 'low': 1, 'normal': 0, 'high': 2, 'urgent': 3 };
        updateData.priority = priorityMap[String(body.priority)] ?? (parseInt(String(body.priority), 10) || 0);
      }
    }

    // Store personal_statement, study_plan, intake in profile_snapshot JSONB
    if (body.personal_statement !== undefined || body.study_plan !== undefined || body.intake !== undefined) {
      // Get existing profile_snapshot to merge
      const { data: existingApp } = await supabase
        .from('applications')
        .select('profile_snapshot')
        .eq('id', id)
        .maybeSingle();

      const existingSnapshot = (existingApp?.profile_snapshot || {}) as Record<string, unknown>;
      const newSnapshot = { ...existingSnapshot };

      if (body.personal_statement !== undefined) newSnapshot.personal_statement = body.personal_statement;
      if (body.study_plan !== undefined) newSnapshot.study_plan = body.study_plan;
      if (body.intake !== undefined) newSnapshot.intake = body.intake;

      updateData.profile_snapshot = newSnapshot;
    }

    // If program_id is changing, validate it exists
    if (body.program_id && body.program_id !== existingApp.program_id) {
      const { data: program } = await supabase
        .from('programs')
        .select('id, university_id')
        .eq('id', body.program_id)
        .maybeSingle();

      if (!program) {
        return NextResponse.json({ error: 'Program not found' }, { status: 400 });
      }
    }

    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: updatedApp, error: updateError } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error('Error in applications [id] PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/applications/[id] - Delete an application (Partner Admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only partner admins can delete applications
    if (user.role !== 'partner') {
      return NextResponse.json({ error: 'Only partners can delete applications' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // Fetch the application to check ownership and status
    const { data: application, error: fetchError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        student_id,
        partner_id,
        students (
          id,
          user_id,
          users (
            id,
            referred_by_partner_id
          )
        )
      `)
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user is partner admin
    const partnerAuthResult = await verifyPartnerAuth(request);
    if ('error' in partnerAuthResult) {
      return partnerAuthResult.error;
    }

    const partnerUser = partnerAuthResult.user;
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only partner admins can delete applications' }, { status: 403 });
    }

    // Get the student's referrer info for partner access control (same logic as GET endpoint)
    const studentData = Array.isArray(application.students) ? application.students[0] : application.students;
    const studentUserData = studentData?.users
      ? (Array.isArray(studentData.users) ? studentData.users[0] : studentData.users)
      : null;
    
    // Determine the student's referrer partner user ID
    let referrerUserId = '';
    if (studentUserData?.referred_by_partner_id) {
      const referrerResult = await getReferrerUserId(application.student_id, supabase);
      referrerUserId = referrerResult || '';
    } else {
      referrerUserId = studentData?.user_id || '';
    }

    // Verify access via canPartnerAccessApplication
    const canAccess = await canPartnerAccessApplication(
      partnerUser,
      referrerUserId,
      application.partner_id
    );
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Only allow deletion for specific statuses
    const allowedDeletionStatuses = ['draft', 'submitted', 'under_review', 'document_request'];
    if (!allowedDeletionStatuses.includes(application.status)) {
      return NextResponse.json({
        error: 'Cannot delete applications that are accepted, rejected, withdrawn, or have scheduled interviews',
        status: application.status
      }, { status: 400 });
    }

    // Delete the application (cascade will handle related records like documents, status history)
    const { error: deleteError } = await supabase
      .from('applications')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting application:', deleteError);
      return NextResponse.json({ error: 'Failed to delete application', details: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error in applications [id] DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
