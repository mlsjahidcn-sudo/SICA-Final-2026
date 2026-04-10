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
            city
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
