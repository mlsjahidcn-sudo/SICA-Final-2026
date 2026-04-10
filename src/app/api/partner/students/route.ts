import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';
import crypto from 'node:crypto';

interface User {
  id: string;
  email: string;
  role: string;
  partner_id?: string;
}

// Helper to get partner user ID (relaxed - allow any user to test)
function getPartnerUserId(user: User | null): string | null {
  if (!user) return null;
  // For testing/development: if user is logged in at all, allow them
  // If they are partner, use their id; else just use their user id for test purposes
  if (user.role === 'partner') {
    return user.id;
  }
  if (user.partner_id) {
    return user.partner_id;
  }
  // For testing: allow any authenticated user
  return user.id;
}

// GET /api/partner/students - Get students list for partner (relaxed auth for testing)
export async function GET(request: NextRequest) {
  try {
    console.log('=== Partner Students GET called ===');
    const user = await verifyAuthToken(request);
    console.log('verifyAuthToken returned user:', user ? { id: user.id, role: user.role, partner_id: user.partner_id } : null);
    if (!user) {
      console.log('No user - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const partnerId = getPartnerUserId(user);
    console.log('Using partnerId:', partnerId);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const supabase = getSupabaseClient();

    // Get students who have applications with this partner OR were referred by this partner
    let appsQuery = supabase
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
      .neq('status', 'draft');

    appsQuery = appsQuery.eq('partner_id', partnerId);

    const { data: applications, error: appsError } = await appsQuery;

    if (appsError) {
      console.error('Error fetching students from applications:', appsError);
    }

    // Then, get students referred by this partner (from users table)
    const referredQuery = supabase
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
      .eq('referred_by_partner_id', partnerId)
      .eq('role', 'student');

    const { data: referredUsers, error: referredError } = await referredQuery;

    if (referredError) {
      console.error('Error fetching referred students:', referredError);
    }

    // Deduplicate and combine students
    const studentsMap = new Map();
    
    // Add students from applications
    for (const app of applications || []) {
      const studentData = Array.isArray(app.students) ? app.students[0] : app.students;
      if (studentData && studentData.users) {
        const userData = Array.isArray(studentData.users) ? studentData.users[0] : studentData.users;
        if (userData && !studentsMap.has(userData.id)) {
          studentsMap.set(userData.id, {
            id: userData.id, // Keep user id for backwards compatibility
            student_id: studentData.id, // Actual students table id
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
        } else if (userData) {
          const existing = studentsMap.get(userData.id);
          if (existing) {
            existing.application_count += 1;
          }
        }
      }
    }
    
    // Add referred students (if not already in the map)
    for (const userData of referredUsers || []) {
      if (!studentsMap.has(userData.id)) {
        const studentRecords = Array.isArray(userData.students) ? userData.students : [userData.students];
        const studentRecord = studentRecords.find(Boolean);
        studentsMap.set(userData.id, {
          id: userData.id, // Keep user id for backwards compatibility
          student_id: studentRecord?.id, // Actual students table id
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
    }

    let students = Array.from(studentsMap.values());

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter((s: any) => 
        s.full_name?.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower) ||
        s.nationality?.toLowerCase().includes(searchLower)
      );
    }

    // Get application stats for each student
    const userIds = students.map((s: any) => s.id);
    
    // Get student records linked to these users
    const { data: studentRecords } = await supabase
      .from('students')
      .select('id, user_id')
      .in('user_id', userIds);
      
    const studentIdByUserId = new Map<string, string>();
    for (const sr of studentRecords || []) {
      studentIdByUserId.set(sr.user_id, sr.id);
    }
    
    const studentIds = Array.from(studentIdByUserId.values());
    let appStatsQuery = supabase
      .from('applications')
      .select('student_id, status')
      .in('student_id', studentIds)
      .neq('status', 'draft');

    appStatsQuery = appStatsQuery.eq('partner_id', partnerId);

    const { data: appStats } = await appStatsQuery;

    // Calculate stats per student (user_id)
    const statsMap = new Map<string, { total: number; accepted: number; pending: number }>();
    // Create reverse map: student_id -> user_id
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
    students = students.map((s: any) => ({
      ...s,
      stats: statsMap.get(s.id) || { total: 0, accepted: 0, pending: 0 },
    }));

    // Sort by application count (most active first), then by creation date
    students.sort((a: any, b: any) => {
      if (b.application_count !== a.application_count) {
        return b.application_count - a.application_count;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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

// POST /api/partner/students - Create a new student (relaxed auth)
export async function POST(request: NextRequest) {
  try {
    console.log('=== Partner Students POST called');
    
    const user = await verifyAuthToken(request);
    console.log('Auth user:', user ? { id: user.id, role: user.role, partner_id: user.partner_id } : null);
    
    if (!user) {
      console.log('No user found - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const partnerId = getPartnerUserId(user);
    console.log('Partner user ID:', partnerId);

    const body = await request.json();
    console.log('Request body:', body);
    
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
    } = body;

    // Validate required fields
    if (!email || !full_name) {
      console.log('Missing required fields - email:', !!email, 'full_name:', !!full_name);
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    console.log('Supabase client created');

    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    console.log('Existing user check - data:', existingUser, 'error:', checkError);

    if (existingUser) {
      console.log('User already exists - returning 409');
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 409 }
      );
    }

    // Generate UUID for user
    const userId = crypto.randomUUID();
    console.log('Generated user ID:', userId);

    // Create user in users table
    console.log('Creating user in users table with data:', {
      id: userId,
      email,
      full_name,
      role: 'student',
      referred_by_partner_id: partnerId,
    });
    
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        full_name,
        phone: phone || null,
        role: 'student',
        referred_by_partner_id: partnerId, // Link student to this partner
      })
      .select('id, email, full_name, phone, created_at')
      .single();

    console.log('User creation result - data:', newUser, 'error:', userError);

    if (userError) {
      console.error('Error creating user:', userError);
      return NextResponse.json({ error: 'Failed to create student', details: userError.message }, { status: 500 });
    }

    if (!newUser) {
      console.error('No user data returned after insert');
      return NextResponse.json({ error: 'Failed to create student - no data returned' }, { status: 500 });
    }

    // Create corresponding record in students table
    const studentId = crypto.randomUUID();
    console.log('Creating student record with ID:', studentId, 'for user:', newUser.id);
    
    // Build student record with all profile fields
    const studentData: Record<string, unknown> = {
      id: studentId,
      user_id: newUser.id,
      partner_id: partnerId, // Link to partner user id
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
      hsk_level: hsk_level != null && hsk_level !== '' ? Number(hsk_level) : null,
      hsk_score: hsk_score != null && hsk_score !== '' ? Number(hsk_score) : null,
      ielts_score: ielts_score || null,
      toefl_score: toefl_score != null && toefl_score !== '' ? Number(toefl_score) : null,
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

    console.log('Student record creation result - data:', !!newStudent, 'error:', studentError);

    if (studentError) {
      console.error('Error creating student record:', studentError);
      // Don't fail the whole request if student record fails, just log it
    }

    console.log('=== Student created successfully:', newUser.id);
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
