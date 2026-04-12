import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth, getPartnerAdminId } from '@/lib/partner-auth-utils';
import { checkEmailExists } from '@/lib/student-validation';
import { createStudentSchema } from '@/lib/validations/student';
import crypto from 'node:crypto';

/**
 * Get the list of user IDs whose students the current partner user can see.
 * - Admin: sees students referred by themselves + all team members
 * - Member: sees only students referred by themselves
 */
async function getVisibleReferrerIds(user: { id: string; partner_role: string | null; partner_id: string | null }): Promise<string[]> {
  const supabase = getSupabaseClient();
  const isAdmin = !user.partner_role || user.partner_role === 'partner_admin';
  
  if (isAdmin) {
    // Admin sees students referred by themselves and all their team members
    const { data: teamMembers } = await supabase
      .from('users')
      .select('id')
      .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
      .eq('role', 'partner');
    
    const ids = (teamMembers || []).map(m => m.id);
    // Ensure admin's own ID is included (in case team query misses it)
    if (!ids.includes(user.id)) ids.push(user.id);
    return ids;
  } else {
    // Member sees only students they personally referred
    return [user.id];
  }
}

// GET /api/partner/students - Get students list for partner
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const supabase = getSupabaseClient();

    // Get the list of referrer IDs this user can see
    const referrerIds = await getVisibleReferrerIds(partnerUser);

    // Get students referred by any of these partner users
    const { data: referredUsers, error: referredError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        created_at,
        referred_by_partner_id,
        students (
          id,
          nationality,
          date_of_birth,
          gender
        )
      `)
      .in('referred_by_partner_id', referrerIds)
      .eq('role', 'student');

    if (referredError) {
      console.error('Error fetching referred students:', referredError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Build students map from referred users
    const studentsMap = new Map<string, Record<string, unknown>>();
    
    for (const userData of referredUsers || []) {
      const studentRecords = Array.isArray(userData.students) ? userData.students : [userData.students];
      const studentRecord = studentRecords.find(Boolean);
      studentsMap.set(userData.id, {
        id: userData.id,
        student_id: studentRecord?.id,
        user_id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        avatar_url: userData.avatar_url,
        nationality: studentRecord?.nationality,
        created_at: userData.created_at,
        referred_by_partner_id: userData.referred_by_partner_id,
        application_count: 0,
      });
    }

    // Also get students via applications (where partner_id matches the partner record)
    const adminId = await getPartnerAdminId(partnerUser.id);
    if (adminId) {
      const { data: partnerRecord } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', adminId)
        .maybeSingle();

      if (partnerRecord) {
        const { data: applications } = await supabase
          .from('applications')
          .select(`
            student_id,
            students (
              id,
              user_id,
              nationality,
              date_of_birth,
              gender,
              users (
                id,
                email,
                full_name,
                phone,
                avatar_url,
                created_at,
                referred_by_partner_id
              )
            )
          `)
          .eq('partner_id', partnerRecord.id)
          .neq('status', 'draft');

        for (const app of applications || []) {
          const studentData = Array.isArray(app.students) ? app.students[0] : app.students;
          if (studentData && studentData.users) {
            const userData = Array.isArray(studentData.users) ? studentData.users[0] : studentData.users;
            if (userData) {
              if (studentsMap.has(userData.id)) {
                const existing = studentsMap.get(userData.id)!;
                existing.application_count = (existing.application_count as number) + 1;
              } else {
                // Only add if this partner user can see this student
                // (student might be referred by a different partner)
                const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
                if (isAdmin) {
                  studentsMap.set(userData.id, {
                    id: userData.id,
                    student_id: studentData.id,
                    user_id: userData.id,
                    email: userData.email,
                    full_name: userData.full_name,
                    phone: userData.phone,
                    avatar_url: userData.avatar_url,
                    nationality: studentData.nationality,
                    created_at: userData.created_at,
                    referred_by_partner_id: userData.referred_by_partner_id,
                    application_count: 1,
                  });
                }
              }
            }
          }
        }
      }
    }

    let students = Array.from(studentsMap.values());

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter((s) => 
        (s.full_name as string)?.toLowerCase().includes(searchLower) ||
        (s.email as string)?.toLowerCase().includes(searchLower) ||
        (s.nationality as string)?.toLowerCase().includes(searchLower)
      );
    }

    // Get application stats for each student
    const userIds = students.map((s) => s.id as string);
    
    const { data: studentRecords } = await supabase
      .from('students')
      .select('id, user_id')
      .in('user_id', userIds);
      
    const studentIdByUserId = new Map<string, string>();
    for (const sr of studentRecords || []) {
      studentIdByUserId.set(sr.user_id, sr.id);
    }
    
    const studentIds = Array.from(studentIdByUserId.values());

    // Get app stats for admin (all partner apps), or member (only their referred students' apps)
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    let appStatsQuery = supabase
      .from('applications')
      .select('student_id, status')
      .in('student_id', studentIds)
      .neq('status', 'draft');

    if (isAdmin) {
      // Admin: all apps for these students with this partner
      const { data: partnerRecord } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', partnerUser.id)
        .maybeSingle();
      if (partnerRecord) {
        appStatsQuery = appStatsQuery.eq('partner_id', partnerRecord.id);
      }
    }

    const { data: appStats } = await appStatsQuery;

    // Calculate stats per student (user_id)
    const statsMap = new Map<string, { total: number; accepted: number; pending: number }>();
    const userIdByStudentId = new Map<string, string>();
    for (const sr of studentRecords || []) {
      userIdByStudentId.set(sr.id, sr.user_id);
    }
    
    for (const stat of appStats || []) {
      const userId = userIdByStudentId.get(stat.student_id);
      if (!userId) continue;
      
      const existing = statsMap.get(userId) || { total: 0, accepted: 0, pending: 0 };
      existing.total += 1;
      if (stat.status === 'accepted') existing.accepted += 1;
      if (['submitted', 'under_review'].includes(stat.status)) existing.pending += 1;
      statsMap.set(userId, existing);
    }

    // Merge stats into students
    students = students.map((s) => ({
      ...s,
      stats: statsMap.get(s.id as string) || { total: 0, accepted: 0, pending: 0 },
    }));

    // Sort by application count (most active first), then by creation date
    students.sort((a, b) => {
      if ((b.application_count as number) !== (a.application_count as number)) {
        return (b.application_count as number) - (a.application_count as number);
      }
      return new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime();
    });

    // Pagination
    const total = students.length;
    const start = (page - 1) * pageSize;
    const paginatedStudents = students.slice(start, start + pageSize);

    return NextResponse.json({
      students: paginatedStudents,
      total,
      page,
      pageSize,
      hasMore: start + pageSize < total,
    });
  } catch (error) {
    console.error('Error in partner students GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/partner/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    const body = await request.json();
    
    // Validate input with Zod
    const validationResult = createStudentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const {
      email,
      full_name,
      phone,
      // Personal information
      nationality,
      date_of_birth,
      gender,
      current_address,
      postal_code,
      permanent_address,
      chinese_name,
      marital_status,
      religion,
      // Emergency contact
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      // Passport information
      passport_number,
      passport_expiry_date,
      passport_issuing_country,
      // Academic information (JSONB arrays)
      education_history,
      work_experience,
      // Legacy single-education fields
      highest_education,
      institution_name,
      field_of_study,
      graduation_date,
      gpa,
      // Language test scores
      hsk_level,
      hsk_score,
      ielts_score,
      toefl_score,
      // Family information
      family_members,
      // Additional information
      extracurricular_activities,
      awards,
      publications,
      research_experience,
      scholarship_application,
      financial_guarantee,
      // Study preferences
      study_mode,
      funding_source,
      // Communication
      wechat_id,
      password, // Optional: if provided, create account with password
    } = validationResult.data;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if user already exists
    const emailCheck = await checkEmailExists(email);
    
    if (emailCheck.exists) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 409 }
      );
    }

    // Resolve the partner admin's user ID and partner record ID
    const adminUserId = await getPartnerAdminId(partnerUser.id);
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', adminUserId || partnerUser.id)
      .maybeSingle();

    // Generate UUID for user
    const userId = crypto.randomUUID();

    // Create user in users table
    // referred_by_partner_id = the partner user who added this student (admin or member)
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        full_name,
        phone: phone || null,
        role: 'student',
        referred_by_partner_id: partnerUser.id, // Track which partner user added this student
      })
      .select('id, email, full_name, phone, created_at')
      .single();

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json({ error: 'Failed to create student', details: userError.message }, { status: 500 });
    }

    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create student - no data returned' }, { status: 500 });
    }

    // Create corresponding record in students table
    const studentId = crypto.randomUUID();
    
    // Build student record with all profile fields
    const studentData: Record<string, unknown> = {
      id: studentId,
      user_id: newUser.id,
      partner_id: partnerRecord?.id || null, // Link to partner organization (partners.id)
      // Personal information
      nationality: nationality || null,
      date_of_birth: date_of_birth || null,
      gender: gender || null,
      current_address: current_address || null,
      postal_code: postal_code || null,
      permanent_address: permanent_address || null,
      chinese_name: chinese_name || null,
      marital_status: marital_status || null,
      religion: religion || null,
      // Emergency contact
      emergency_contact_name: emergency_contact_name || null,
      emergency_contact_phone: emergency_contact_phone || null,
      emergency_contact_relationship: emergency_contact_relationship || null,
      // Passport information
      passport_number: passport_number || null,
      passport_expiry_date: passport_expiry_date || null,
      passport_issuing_country: passport_issuing_country || null,
      // Academic information (JSONB arrays - validate as arrays)
      education_history: Array.isArray(education_history) ? education_history : null,
      work_experience: Array.isArray(work_experience) ? work_experience : null,
      // Legacy single-education fields
      highest_education: highest_education || null,
      institution_name: institution_name || null,
      field_of_study: field_of_study || null,
      graduation_date: graduation_date || null,
      gpa: gpa || null,
      // Language test scores
      hsk_level: hsk_level ?? null,
      hsk_score: hsk_score ?? null,
      ielts_score: ielts_score || null,
      toefl_score: toefl_score ?? null,
      // Family information
      family_members: Array.isArray(family_members) ? family_members : null,
      // Additional information
      extracurricular_activities: Array.isArray(extracurricular_activities) ? extracurricular_activities : null,
      awards: Array.isArray(awards) ? awards : null,
      publications: Array.isArray(publications) ? publications : null,
      research_experience: Array.isArray(research_experience) ? research_experience : null,
      scholarship_application: scholarship_application && typeof scholarship_application === 'object' && !Array.isArray(scholarship_application) ? scholarship_application : null,
      financial_guarantee: financial_guarantee && typeof financial_guarantee === 'object' && !Array.isArray(financial_guarantee) ? financial_guarantee : null,
      // Study preferences
      study_mode: study_mode || null,
      funding_source: funding_source || null,
      // Communication
      wechat_id: wechat_id || null,
    };

    const { data: newStudent, error: studentError } = await supabase
      .from('students')
      .insert(studentData)
      .select('*')
      .single();

    if (studentError) {
      console.error('Error creating student record:', studentError);
      // Don't fail the whole request if student record fails, just log it
    }

    // If password provided, create Supabase Auth account
    if (password && typeof password === 'string' && password.length >= 8) {
      try {
        const { url, serviceKey } = { 
          url: process.env.COZE_SUPABASE_URL || '', 
          serviceKey: process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || '' 
        };
        // Use admin API to create user with password
        const createRes = await fetch(`${url}/auth/v1/admin/users`, {
          method: 'POST',
          headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              role: 'student',
              full_name,
            },
          }),
        });
        
        if (!createRes.ok) {
          const errData = await createRes.json();
          console.error('Auth account creation failed:', errData.msg);
        }
      } catch (authErr) {
        console.error('Auth account creation error:', authErr);
      }
    }

    // Log activity
    try {
      await supabase.from('partner_team_activity').insert({
        user_id: partnerUser.id,
        action: 'add_student',
        entity_type: 'student',
        entity_id: newUser.id,
        details: { student_email: email, student_name: full_name },
      });
    } catch {
      // Non-critical
    }

    return NextResponse.json({ 
      student: {
        ...newUser,
        ...newStudent,
      } 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in partner students POST:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
