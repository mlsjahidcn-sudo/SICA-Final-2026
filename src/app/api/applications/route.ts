import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

interface User {
  id: string;
  email: string;
  role: string;
  partner_id?: string;
}

// Helper to get partner ID for the current user (either partner themselves or team member)
function getPartnerIdForUser(user: User | null): string | null {
  // If user is a partner, use their own ID
  if (user?.role === 'partner') {
    return user.id;
  }
  // If user has partner_id (team member), use that
  if (user?.partner_id) {
    return user.partner_id;
  }
  return null;
}

// GET /api/applications - List user's applications (student) or managed applications (partner/admin)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status') || '';
    const degreeType = searchParams.get('degreeType') || '';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'submitted_desc';
    
    const offset = (page - 1) * pageSize;

    // Build query
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        reviewed_at,
        created_at,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name,
            name_en,
            name_cn,
            city,
            province
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
            email
          )
        )
      `, { count: 'exact' });

    // Role-based filters
    if (user.role === 'student') {
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      if (studentRec) {
        query = query.eq('student_id', studentRec.id);
      }
    } else if (user.role === 'partner' || user.partner_id) {
      const partnerId = getPartnerIdForUser(user);
      if (partnerId) {
        query = query.eq('partner_id', partnerId);
      }
    }

    // Status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Degree level filter (normalize)
    if (degreeType && degreeType !== 'all') {
      const normalizedDegree = degreeType.charAt(0).toUpperCase() + degreeType.slice(1);
      query = query.eq('programs.degree_level', normalizedDegree);
    }

    // Search filter
    if (search) {
      query = query.or(`
        students.first_name.ilike.%${search}%,
        students.last_name.ilike.%${search}%,
        students.email.ilike.%${search}%,
        students.nationality.ilike.%${search}%,
        programs.name.ilike.%${search}%,
        programs.universities.name.ilike.%${search}%,
        programs.universities.name_en.ilike.%${search}%
      `);
    }

    // Sorting
    switch (sort) {
      case 'submitted_desc':
        query = query.order('submitted_at', { ascending: false, nullsFirst: false });
        break;
      case 'submitted_asc':
        query = query.order('submitted_at', { ascending: true, nullsFirst: false });
        break;
      case 'name_asc':
        query = query.order('students(last_name)', { ascending: true });
        break;
      case 'name_desc':
        query = query.order('students(last_name)', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    query = query.range(offset, offset + pageSize - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Fix relations (Supabase returns arrays for has-many)
    const normalizedApplications = applications?.map(app => ({
      ...app,
      programs: Array.isArray(app.programs) ? app.programs[0] : app.programs,
      students: Array.isArray(app.students) ? app.students[0] : app.students,
    })) || [];

    const total = count || 0;
    const hasMore = offset + pageSize < total;

    return NextResponse.json({
      applications: normalizedApplications,
      total,
      page,
      pageSize,
      hasMore,
      // Backward compatibility
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error in applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/applications - Create a new application (student or partner)
export async function POST(request: NextRequest) {
  console.log("POST /api/applications called")
  try {
    const user = await verifyAuthToken(request);
    console.log("verifyAuthToken user:", user)
    const partnerId = getPartnerIdForUser(user);
    console.log("partnerId:", partnerId)
    if (!user || !['student', 'partner', 'admin'].includes(user.role) && !partnerId) {
      console.log("Unauthorized!")
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    console.log("request body:", body)
    const {
      student_id, // Required for partners/admins (students.id, not users.id)
      user_id, // Alternative: if partner provides users.id, look up students.id
      program_id,
      requested_university_program_note, // New field
      selected_program_ids, // New field (for storing all selected programs)
      intake,
    } = body;

    // Validate required fields: either program_id OR requested_university_program_note must be present
    if (!program_id && !requested_university_program_note) {
      console.log("Missing program_id and requested_university_program_note")
      return NextResponse.json(
        { error: 'Either program or request note is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    console.log("supabase client initialized")
    
    // Determine student ID (students.id, not users.id)
    let finalStudentId: string;
    if (user.role === 'student') {
      // For students, get their student record id via user_id
      console.log("User is student, getting student record via user_id:", user.id)
      const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user.id).single();
      console.log("studentRec from user.id:", studentRec)
      if (!studentRec) {
        console.log("Student record not found")
        return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
      }
      finalStudentId = studentRec.id;
    } else {
      // Partner or admin: use student_id if provided, else look up via user_id
      console.log("User is partner/admin, student_id from body:", student_id)
      if (student_id) {
        finalStudentId = student_id;
      } else if (user_id) {
        const { data: studentRec } = await supabase.from('students').select('id').eq('user_id', user_id).single();
        if (!studentRec) {
          return NextResponse.json({ error: 'Student record not found for this user' }, { status: 404 });
        }
        finalStudentId = studentRec.id;
      } else {
        console.log("Missing student_id or user_id")
        return NextResponse.json({ error: 'Either student_id or user_id is required' }, { status: 400 });
      }
    }
    console.log("finalStudentId:", finalStudentId)

    // Determine partner ID
    const finalPartnerId: string | null = partnerId;
    console.log("finalPartnerId:", finalPartnerId)

    // If program_id is provided, check if student already has an application for this program
    if (program_id) {
      console.log("Checking existing application for program_id:", program_id, "student_id:", finalStudentId)
      const { data: existing } = await supabase
        .from('applications')
        .select('id')
        .eq('student_id', finalStudentId)
        .eq('program_id', program_id)
        .single();
      console.log("existing application:", existing)

      if (existing) {
        return NextResponse.json(
          { error: 'Student has already applied for this program' },
          { status: 400 }
        );
      }
    }

    // Store all extra form data in profile_snapshot JSONB column
    // The applications table only has: student_id, program_id, partner_id, status, priority, notes, profile_snapshot
    const profileSnapshot = {
      passport_number: body.passport_number,
      first_name: body.passport_first_name || body.first_name,
      last_name: body.passport_last_name || body.last_name,
      nationality: body.nationality,
      date_of_birth: body.date_of_birth,
      gender: body.gender,
      email: body.email,
      phone: body.phone,
      current_address: body.current_address,
      permanent_address: body.permanent_address,
      highest_degree: body.highest_degree,
      graduation_school: body.graduation_school,
      graduation_date: body.graduation_date,
      gpa: body.gpa,
      chinese_level: body.chinese_level,
      chinese_test_score: body.chinese_test_score,
      chinese_test_date: body.chinese_test_date,
      english_level: body.english_level,
      english_test_type: body.english_test_type,
      english_test_score: body.english_test_score,
      english_test_date: body.english_test_date,
      study_plan: body.study_plan,
      research_interest: body.research_interest,
      career_goals: body.career_goals,
      requested_university_program_note,
      selected_program_ids,
    };
    console.log("profileSnapshot:", profileSnapshot, "intake:", intake)

    // Temporarily store intake in profile_snapshot only, since Supabase REST API isn't seeing the intake column yet
    const profileSnapshotWithIntake = {
      ...profileSnapshot,
      intake, // Store intake inside profile_snapshot for now
    };
    console.log("Inserting into applications table with:", {
      student_id: finalStudentId,
      program_id,
      partner_id: finalPartnerId,
      status: 'draft',
      profile_snapshot: profileSnapshotWithIntake,
    })
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        student_id: finalStudentId,
        program_id,
        partner_id: finalPartnerId,
        status: 'draft',
        profile_snapshot: profileSnapshotWithIntake,
      })
      .select('*')
      .single();
    console.log("Supabase insert result: application:", application, "error:", error)

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application', details: error }, { status: 500 });
    }

    console.log("Returning application:", application)
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error in applications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
