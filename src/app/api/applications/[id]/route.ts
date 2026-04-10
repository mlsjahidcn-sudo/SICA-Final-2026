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
    // Admin can access apps from their partner org (applications.partner_id matches partners.id)
    if (applicationPartnerId) {
      const { data: partnerRecord } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', partnerUser.id)
        .maybeSingle();
      if (partnerRecord && partnerRecord.id === applicationPartnerId) {
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
        *,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            name_cn,
            city,
            logo_url
          )
        ),
        students (
          id,
          user_id,
          first_name,
          last_name,
          nationality,
          email,
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

      // Get the student's user_id (the referrer target)
      const studentData = Array.isArray(application.students) ? application.students[0] : application.students;
      const studentUserId = studentData?.users?.referred_by_partner_id
        ? await getReferrerUserId(application.student_id, supabase)
        : studentData?.user_id;

      const canAccess = await canPartnerAccessApplication(
        partnerUser,
        studentUserId || '',
        application.partner_id
      );
      if (!canAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // Admin role: no restrictions

    // Fix relations (Supabase returns arrays for has-many)
    const normalizedApplication = {
      ...application,
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

    // Only draft applications can be edited by partners/students
    if (existingApp.status !== 'draft') {
      return NextResponse.json({ error: 'Only draft applications can be edited' }, { status: 400 });
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

    // Build update data - only allow specific fields
    const allowedFields = ['program_id', 'notes'];
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const field of allowedFields) {
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

    // Profile snapshot stores personal_statement, study_plan, etc.
    if (body.profile_snapshot !== undefined) {
      updateData.profile_snapshot = body.profile_snapshot;
    }

    // If program_id is changing, validate it exists and update partner_id if needed
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
