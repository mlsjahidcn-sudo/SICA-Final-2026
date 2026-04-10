import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/applications - List student's applications
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    
    // Get student record
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!studentRecord) {
      // No student record means no applications
      return NextResponse.json({
        applications: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    const offset = (page - 1) * limit;

    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        submitted_at,
        profile_snapshot,
        programs (
          id,
          name,
          degree_level,
          tuition_fee_per_year,
          currency,
          duration_years,
          application_end_date,
          universities (
            id,
            name_en,
            city,
            province,
            logo_url
          )
        )
      `, { count: 'exact' })
      .eq('student_id', studentRecord.id);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply search filter (search in program name or university name)
    if (search) {
      query = query.or(`programs.name.ilike.%${search}%,programs.universities.name_en.ilike.%${search}%`);
    }

    query = query
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching student applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({
      applications: applications || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });

  } catch (error) {
    console.error('Error in student applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/student/applications - Create a new application
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can create applications' }, { status: 403 });
    }

    const body = await request.json();
    const {
      program_id,
      university_id,
      partner_id,
      personal_statement,
      study_plan,
      intake,
    } = body;

    if (!program_id) {
      return NextResponse.json(
        { error: 'Program ID is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if student record exists, if not create one
    // eslint-disable-next-line prefer-const
    let { data: studentRecord, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (studentError && studentError.code !== 'PGRST116') {
      console.error('Error checking student record:', studentError);
      return NextResponse.json({ error: 'Failed to verify student record' }, { status: 500 });
    }

    // Create student record if it doesn't exist
    if (!studentRecord) {
      const { data: newStudent, error: createError } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating student record:', createError);
        return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 });
      }
      studentRecord = newStudent;
    }

    const studentId = studentRecord.id;

    // Check if user already has an application for this program
    const { data: existing } = await supabase
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .eq('program_id', program_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'You have already applied for this program' },
        { status: 400 }
      );
    }

    // Get university_id from program if not provided
    let targetUniversityId = university_id;
    if (!targetUniversityId) {
      const { data: program } = await supabase
        .from('programs')
        .select('university_id')
        .eq('id', program_id)
        .single();
      targetUniversityId = program?.university_id;
    }

    // Get intake from program if not provided (default to next available intake)
    let targetIntake = intake;
    if (!targetIntake) {
      // Default intake based on current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      // If before July, default to Fall of current year, otherwise Spring of next year
      if (month < 7) {
        targetIntake = `Fall ${year}`;
      } else {
        targetIntake = `Spring ${year + 1}`;
      }
    }

    // Fetch student profile data to sync with application
    const { data: studentProfile } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    const { data: userProfile } = await supabase
      .from('users')
      .select('full_name, email, phone')
      .eq('id', user.id)
      .single();

    // Build the application record - personal_statement/study_plan/intake go into profile_snapshot
    const profileSnapshot = {
      personal_statement: personal_statement || '',
      study_plan: study_plan || '',
      intake: targetIntake,
      university_id: targetUniversityId,
    };

    const applicationData: Record<string, unknown> = {
      student_id: studentId,
      user_id: user.id,
      program_id,
      university_id: targetUniversityId,
      partner_id: partner_id || null,
      status: 'draft',
      profile_snapshot: profileSnapshot,
    };

    const { data: application, error } = await supabase
      .from('applications')
      .insert(applicationData)
      .select(`
        id,
        status,
        created_at,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            city
          )
        )
      `)
      .single();

    if (error) {
      console.error('Error creating application:', error);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });

  } catch (error) {
    console.error('Error in student applications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
