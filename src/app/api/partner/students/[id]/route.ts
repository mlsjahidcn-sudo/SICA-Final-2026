import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth, getPartnerAdminId } from '@/lib/partner-auth-utils';

/**
 * Check if a partner user can access a specific student.
 * - Admin: can access any student from their team (referred by admin or any team member)
 * - Member: can only access students they personally referred
 */
async function canAccessStudent(
  partnerUser: { id: string; partner_role: string | null; partner_id: string | null },
  studentUserId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
  
  // Look up the student's referred_by_partner_id
  const { data: studentUser } = await supabase
    .from('users')
    .select('referred_by_partner_id')
    .eq('id', studentUserId)
    .maybeSingle();

  if (!studentUser) return false;

  if (isAdmin) {
    // Admin can access students referred by themselves or any team member
    const adminId = await getPartnerAdminId(partnerUser.id);
    return studentUser.referred_by_partner_id === adminId ||
           studentUser.referred_by_partner_id === partnerUser.id ||
           // Also check if the referrer is a team member under this admin
           (adminId != null && studentUser.referred_by_partner_id != null && await isTeamMember(studentUser.referred_by_partner_id, adminId));
  } else {
    // Member can only access students they referred
    return studentUser.referred_by_partner_id === partnerUser.id;
  }
}

async function isTeamMember(userId: string, adminId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .eq('partner_id', adminId)
    .eq('role', 'partner')
    .maybeSingle();
  return !!data;
}

// GET /api/partner/students/[id] - Get student detail
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    // Check access
    const canAccess = await canAccessStudent(partnerUser, id);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, phone, avatar_url, created_at')
      .eq('id', id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', id)
      .maybeSingle();

    if (studentError) {
      console.error('Error fetching student details:', studentError);
    }

    // Get applications for this student
    const { data: applications } = await supabase
      .from('applications')
      .select('id, status, created_at, programs (id, name, degree, universities (id, name))')
      .eq('student_id', student?.id)
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    return NextResponse.json({
      student: {
        ...user,
        ...student,
        applications: applications || [],
      },
    });
  } catch (error) {
    console.error('Error in partner student GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/students/[id] - Update student
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    // Check access
    const canAccess = await canAccessStudent(partnerUser, id);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const supabase = getSupabaseClient();

    // Update user info
    const userUpdateData: Record<string, unknown> = {};
    if (body.full_name !== undefined) userUpdateData.full_name = body.full_name;
    if (body.phone !== undefined) userUpdateData.phone = body.phone;
    
    if (Object.keys(userUpdateData).length > 0) {
      const { error: userUpdateError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', id);

      if (userUpdateError) {
        return NextResponse.json({ error: 'Failed to update student', details: userUpdateError.message }, { status: 500 });
      }
    }

    // Update student info
    const studentFields = [
      'nationality', 'date_of_birth', 'gender', 'current_address', 'postal_code',
      'permanent_address', 'chinese_name', 'marital_status', 'religion',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
      'passport_number', 'passport_expiry_date', 'passport_issuing_country',
      'education_history', 'work_experience',
      'highest_education', 'institution_name', 'field_of_study', 'graduation_date', 'gpa',
      'hsk_level', 'hsk_score', 'ielts_score', 'toefl_score',
      'family_members', 'extracurricular_activities', 'awards', 'publications',
      'research_experience', 'scholarship_application', 'financial_guarantee',
      'study_mode', 'funding_source', 'wechat_id',
    ];

    const studentUpdateData: Record<string, unknown> = {};
    for (const field of studentFields) {
      if (body[field] !== undefined) {
        studentUpdateData[field] = body[field];
      }
    }

    if (Object.keys(studentUpdateData).length > 0) {
      const { error: studentUpdateError } = await supabase
        .from('students')
        .update(studentUpdateData)
        .eq('user_id', id);

      if (studentUpdateError) {
        return NextResponse.json({ error: 'Failed to update student details', details: studentUpdateError.message }, { status: 500 });
      }
    }

    // Log activity
    try {
      await supabase.from('partner_team_activity').insert({
        user_id: partnerUser.id,
        action: 'update_student',
        entity_type: 'student',
        entity_id: id,
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in partner student PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/students/[id] - Remove student access
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    // Only admin can delete students
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Only partner admin can remove students' }, { status: 403 });
    }

    // Check access
    const canAccess = await canAccessStudent(partnerUser, id);
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    // Clear the referral link (don't actually delete the student)
    const { error } = await supabase
      .from('users')
      .update({ referred_by_partner_id: null })
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
    }

    // Also clear partner_id on student record
    await supabase
      .from('students')
      .update({ partner_id: null })
      .eq('user_id', id);

    // Log activity
    try {
      await supabase.from('partner_team_activity').insert({
        user_id: partnerUser.id,
        action: 'remove_student',
        entity_type: 'student',
        entity_id: id,
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in partner student DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
