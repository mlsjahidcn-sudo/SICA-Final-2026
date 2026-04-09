import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { STUDENT_SAFE_COLUMNS } from '@/lib/profile-completion';

interface User {
  id: string;
  email: string;
  role: string;
  partner_id?: string;
}

// Helper to get partner user ID for the current user (either partner themselves or team member)
function getPartnerUserId(user: User | null): string | null {
  if (!user) return null;
  if (user.role === 'partner') return user.id;
  if (user.partner_id) return user.partner_id;
  return null;
}

// Helper to get partner record ID from the partners table
async function getPartnerRecordId(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data: partnerRecord } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle();
  return partnerRecord?.id || null;
}

// JSONB array fields that need array validation
const JSONB_ARRAY_FIELDS = new Set(['work_experience', 'education_history', 'family_members', 'extracurricular_activities', 'awards', 'publications', 'research_experience']);

// JSONB object fields (single objects, not arrays)
const JSONB_OBJECT_FIELDS = new Set(['scholarship_application', 'financial_guarantee']);

// Numeric fields that need number validation
const NUMERIC_FIELDS = new Set(['hsk_level', 'hsk_score', 'toefl_score']);

// Enum fields with allowed values
const ENUM_FIELDS: Record<string, string[]> = {
  marital_status: ['single', 'married', 'divorced', 'widowed'],
  study_mode: ['full_time', 'part_time'],
  funding_source: ['self_funded', 'csc_scholarship', 'university_scholarship', 'government_scholarship', 'other'],
};

// GET /api/partner/students/[id] - Get student details for partner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('=== Partner Student Detail GET called');
    const user = await verifyAuthToken(request);
    console.log('Auth user:', user ? { id: user.id, role: user.role } : null);
    
    if (!user) {
      console.log('No user - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partnerUserId = getPartnerUserId(user as unknown as User);
    console.log('Partner user ID:', partnerUserId);
    
    if (!partnerUserId) {
      console.log('No partner ID - returning 403');
      return NextResponse.json({ error: 'Unauthorized: Not a partner or team member' }, { status: 403 });
    }

    // Get partner record ID from partners table
    const partnerRecordId = await getPartnerRecordId(partnerUserId);
    console.log('Partner record ID:', partnerRecordId);

    const { id: studentUserId } = await params;
    console.log('Student User ID:', studentUserId);
    
    const supabase = getSupabaseClient();

    // First, look up the student record to get the students.id for application checks
    const { data: studentRecord, error: studentRecordError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentUserId)
      .maybeSingle();
    
    console.log('Student record:', studentRecord, 'Error:', studentRecordError);

    // Verify this partner has access to this student (via applications OR referred by this partner)
    let hasAppAccess = false;
    if (studentRecord && partnerRecordId) {
      const { data: appAccess, error: appAccessError } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', studentRecord.id)
        .eq('partner_id', partnerRecordId)
        .limit(1)
        .maybeSingle();
      console.log('App access:', appAccess, 'Error:', appAccessError);
      hasAppAccess = !!appAccess;
    }

    // Also check if student was referred by this partner
    const { data: referredStudent, error: referredError } = await supabase
      .from('users')
      .select('id, referred_by_partner_id')
      .eq('id', studentUserId)
      .maybeSingle();
    
    console.log('Referred student:', referredStudent, 'Error:', referredError);
    console.log('Partner user ID for comparison:', partnerUserId);
    console.log('Has app access:', hasAppAccess, 'Referred:', !!referredStudent && referredStudent.referred_by_partner_id === partnerUserId);

    if (!hasAppAccess && !(referredStudent && referredStudent.referred_by_partner_id === partnerUserId)) {
      console.log('Access denied - returning 404');
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        created_at,
        updated_at
      `)
      .eq('id', studentUserId)
      .single();

    console.log('Student query result - data:', !!student, 'error:', studentError);

    if (studentError || !student) {
      console.log('Student query failed - returning 404');
      return NextResponse.json({ error: 'Student not found', details: studentError?.message }, { status: 404 });
    }

    // Get student's extended profile from students table
    const { data: studentProfile } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', studentUserId)
      .single();

    // Get student's applications with this partner
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        submitted_at,
        passport_first_name,
        passport_last_name,
        nationality,
        highest_degree,
        gpa,
        programs (
          id,
          name_en,
          name_cn,
          degree_type,
          discipline,
          duration_months,
          tuition_per_year,
          tuition_currency,
          universities (
            id,
            name_en,
            name_cn,
            city,
            province
          )
        )
      `)
      .eq('student_id', studentRecord?.id || '')
      .eq('partner_id', partnerRecordId)
      .neq('status', 'draft')
      .order('created_at', { ascending: false });

    if (appsError) {
      console.error('Error fetching applications:', appsError);
    }

    // Calculate stats
    const stats = {
      totalApplications: applications?.length || 0,
      accepted: applications?.filter(a => a.status === 'accepted').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0,
      pending: applications?.filter(a => ['submitted', 'under_review'].includes(a.status)).length || 0,
    };

    return NextResponse.json({
      student: {
        ...student,
        profile: studentProfile,
        applications: applications || [],
        stats,
      },
    });
  } catch (error) {
    console.error('Error in partner student detail GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/partner/students/[id] - Update student profile (partner or team member)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partnerUserId = getPartnerUserId(user as unknown as User);
    if (!partnerUserId) {
      return NextResponse.json({ error: 'Unauthorized: Not a partner or team member' }, { status: 403 });
    }

    // Get partner record ID from partners table
    const partnerRecordId = await getPartnerRecordId(partnerUserId);

    const { id: studentUserId } = await params;
    const supabase = getSupabaseClient();

    // Verify access: via applications OR referred by this partner
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentUserId)
      .maybeSingle();

    let hasAccess = false;
    if (studentRecord && partnerRecordId) {
      const { data: appAccess } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', studentRecord.id)
        .eq('partner_id', partnerRecordId)
        .limit(1)
        .maybeSingle();
      hasAccess = !!appAccess;
    }

    const { data: referredStudent } = await supabase
      .from('users')
      .select('id')
      .eq('id', studentUserId)
      .eq('referred_by_partner_id', partnerUserId)
      .maybeSingle();

    if (!hasAccess && !referredStudent) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    const requestData = await request.json();

    // Update user table fields if provided
    if (requestData.full_name || requestData.phone) {
      const userUpdateData: Record<string, string> = {};
      if (requestData.full_name) userUpdateData.full_name = requestData.full_name;
      if (requestData.phone) userUpdateData.phone = requestData.phone;

      const { error: updateError } = await supabase
        .from('users')
        .update(userUpdateData)
        .eq('id', studentUserId);
      if (updateError) console.error('User update error:', updateError.message);
    }

    // Update student profile fields
    if (requestData.student_profile) {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', studentUserId)
        .maybeSingle();

      // Use the centralized safe columns whitelist (same as student profile API)
      const safeStudentData: Record<string, unknown> = {};
      for (const col of STUDENT_SAFE_COLUMNS) {
        if (requestData.student_profile[col] !== undefined) {
          const value = requestData.student_profile[col];

          // Validate JSONB array fields
          if (JSONB_ARRAY_FIELDS.has(col)) {
            if (Array.isArray(value)) {
              safeStudentData[col] = value;
            }
            continue;
          }

          // Validate JSONB object fields
          if (JSONB_OBJECT_FIELDS.has(col)) {
            if (value === null || value === '') {
              safeStudentData[col] = null;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
              safeStudentData[col] = value;
            }
            continue;
          }

          // Validate numeric fields
          if (NUMERIC_FIELDS.has(col)) {
            if (value === '' || value === null) {
              safeStudentData[col] = null;
            } else {
              const num = Number(value);
              if (!isNaN(num) && num >= 0) {
                safeStudentData[col] = num;
              }
            }
            continue;
          }

          // Validate enum fields
          if (ENUM_FIELDS[col]) {
            if (!value || ENUM_FIELDS[col].includes(value)) {
              safeStudentData[col] = value || null;
            }
            continue;
          }

          safeStudentData[col] = value;
        }
      }

      if (existingStudent) {
        const { error: updateError } = await supabase
          .from('students')
          .update(safeStudentData)
          .eq('user_id', studentUserId);
        if (updateError) console.error('Student update error:', updateError.message);
      } else {
        const { error: insertError } = await supabase
          .from('students')
          .insert({ user_id: studentUserId, ...safeStudentData });
        if (insertError) console.error('Student insert error:', insertError.message);
      }
    }

    // Return updated profile
    const { data: finalUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', studentUserId)
      .single();

    const { data: finalStudent } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', studentUserId)
      .single();

    return NextResponse.json({
      student: {
        ...finalUser,
        profile: finalStudent,
      },
    });
  } catch (error) {
    console.error('Error in partner student detail PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/partner/students/[id] - Delete a student (partner or team member only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const partnerUserId = getPartnerUserId(user as unknown as User);
    if (!partnerUserId) {
      return NextResponse.json({ error: 'Unauthorized: Not a partner or team member' }, { status: 403 });
    }

    const partnerRecordId = await getPartnerRecordId(partnerUserId);
    const { id: studentUserId } = await params;
    const supabase = getSupabaseClient();

    // Verify access: via applications OR referred by this partner
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', studentUserId)
      .maybeSingle();

    let hasAccess = false;
    if (studentRecord && partnerRecordId) {
      const { data: appAccess } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', studentRecord.id)
        .eq('partner_id', partnerRecordId)
        .limit(1)
        .maybeSingle();
      hasAccess = !!appAccess;
    }

    const { data: referredStudent } = await supabase
      .from('users')
      .select('id')
      .eq('id', studentUserId)
      .eq('referred_by_partner_id', partnerUserId)
      .maybeSingle();

    if (!hasAccess && !referredStudent) {
      return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
    }

    // Check if student has any non-draft applications
    if (studentRecord) {
      const { data: activeApps } = await supabase
        .from('applications')
        .select('id, status')
        .eq('student_id', studentRecord.id)
        .neq('status', 'draft')
        .limit(1)
        .maybeSingle();

      if (activeApps) {
        return NextResponse.json(
          { error: 'Cannot delete student with active applications. Please withdraw or remove their applications first.' },
          { status: 400 }
        );
      }
    }

    // Delete student record from students table
    if (studentRecord) {
      const { error: studentDeleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', studentRecord.id);

      if (studentDeleteError) {
        console.error('Error deleting student record:', studentDeleteError);
        return NextResponse.json({ error: 'Failed to delete student record', details: studentDeleteError.message }, { status: 500 });
      }
    }

    // Delete user record from users table
    const { error: userDeleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', studentUserId);

    if (userDeleteError) {
      console.error('Error deleting user:', userDeleteError);
      return NextResponse.json({ error: 'Failed to delete student', details: userDeleteError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error in partner student detail DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
