import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/admin/applications - List all applications (admin/partner)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || !['admin', 'partner'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const universityId = searchParams.get('university_id') || '';
    const degreeLevel = searchParams.get('degree_type') || searchParams.get('degree_level') || '';
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Build query with correct schema columns
    // applications: student_id (-> students), program_id (-> programs)
    // programs: name, degree_level (NOT name_en, degree_type)
    // universities: name_en (NOT name)
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        priority,
        notes,
        profile_snapshot,
        submitted_at,
        created_at,
        updated_at,
        students (
          id,
          user_id,
          nationality,
          gender,
          highest_education,
          users (
            id,
            full_name,
            email
          )
        ),
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            city,
            province
          )
        )
      `, { count: 'exact' });

    // Partners can only see applications of students they referred
    if (user.role === 'partner') {
      query = query.eq('partner_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (universityId) {
      query = query.eq('programs.university_id', universityId);
    }

    if (degreeLevel) {
      query = query.eq('programs.degree_level', degreeLevel);
    }

    if (search) {
      // Search in student user name or program name
      query = query.or(`students.users.full_name.ilike.%${search}%,programs.name.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Transform data to flatten structure for frontend
    const transformedApplications = (applications || []).map(app => {
      // Handle Supabase returning relations as arrays or single objects
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const studentUser = student?.users
        ? (Array.isArray(student.users) ? student.users[0] : student.users)
        : null;
      const program = Array.isArray(app.programs) ? app.programs[0] : app.programs;
      const university = program?.universities
        ? (Array.isArray(program.universities) ? program.universities[0] : program.universities)
        : null;
      
      return {
        id: app.id,
        status: app.status,
        priority: app.priority,
        notes: app.notes,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        program: program ? {
          id: program.id,
          name: program.name,
          degree_level: program.degree_level,
          university: university ? {
            id: university.id,
            name_en: university.name_en,
            city: university.city,
            province: university.province,
          } : null,
        } : null,
        student: {
          id: student?.id,
          user_id: student?.user_id,
          full_name: studentUser?.full_name,
          email: studentUser?.email,
          nationality: student?.nationality,
          gender: student?.gender,
          highest_education: student?.highest_education,
        },
      };
    });

    // Compute stats from the current result set
    const stats = {
      total: count || 0,
      submitted: 0,
      under_review: 0,
      document_request: 0,
      interview_scheduled: 0,
      accepted: 0,
      rejected: 0,
    };
    // Count statuses from the current page (approximate)
    for (const app of applications || []) {
      const s = app.status as string;
      if (s in stats) {
        (stats as Record<string, number>)[s]++;
      }
    }

    // Get total counts across all applications (not just current page)
    const { data: allStatuses } = await supabase
      .from('applications')
      .select('status');
    
    if (allStatuses) {
      const fullStats = {
        total: allStatuses.length,
        submitted: 0,
        under_review: 0,
        document_request: 0,
        interview_scheduled: 0,
        accepted: 0,
        rejected: 0,
      };
      for (const row of allStatuses) {
        const s = row.status as string;
        if (s in fullStats) {
          (fullStats as Record<string, number>)[s]++;
        }
      }
      Object.assign(stats, fullStats);
    }

    return NextResponse.json({
      applications: transformedApplications,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats,
    });
  } catch (error) {
    console.error('Error in admin applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/applications - Create a new application (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const {
      student_id, // students.id (required)
      program_id, // programs.id (optional if requested_university_program_note provided)
      requested_university_program_note, // Free text if no program selected
      intake, // Intake period (e.g., "Fall 2025")
      personal_statement,
      study_plan,
      notes, // Admin notes
      priority = 0, // 0=normal, 1=low, 2=high, 3=urgent
      partner_id, // Optional: partner who referred this student
    } = body;

    // Validate required fields
    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (!program_id && !requested_university_program_note) {
      return NextResponse.json(
        { error: 'Either program_id or requested_university_program_note is required' },
        { status: 400 }
      );
    }

    // Verify student exists
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify program exists if provided
    if (program_id) {
      const { data: program, error: programError } = await supabase
        .from('programs')
        .select('id')
        .eq('id', program_id)
        .maybeSingle();

      if (programError || !program) {
        return NextResponse.json({ error: 'Program not found' }, { status: 404 });
      }
    }

    // Build profile_snapshot
    const profileSnapshot: Record<string, unknown> = {};
    if (intake) profileSnapshot.intake = intake;
    if (personal_statement) profileSnapshot.personal_statement = personal_statement;
    if (study_plan) profileSnapshot.study_plan = study_plan;
    if (requested_university_program_note) {
      profileSnapshot.requested_university_program_note = requested_university_program_note;
    }

    // Create the application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        student_id,
        program_id: program_id || null,
        partner_id: partner_id || null,
        status: 'draft',
        priority,
        notes,
        profile_snapshot: Object.keys(profileSnapshot).length > 0 ? profileSnapshot : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select(`
        id,
        status,
        priority,
        notes,
        created_at,
        students (
          id,
          users (
            id,
            full_name,
            email
          )
        ),
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('Error in admin applications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
