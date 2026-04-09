import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import crypto from 'node:crypto';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        nationality,
        created_at,
        last_sign_in_at,
        students!students_user_id_users_id_fk (
          id,
          passport_first_name,
          passport_last_name,
          passport_number,
          date_of_birth,
          gender,
          city,
          province
        )
      `, { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: students, error, count } = await query;

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Get application counts for each student
    const studentIds = students?.map(s => s.id) || [];
    const { data: applicationCounts } = await supabaseAdmin
      .from('applications')
      .select('user_id, status')
      .in('user_id', studentIds);

    // Count applications per student
    const applicationMap = new Map<string, { total: number; pending: number }>();
    for (const app of (applicationCounts || [])) {
      const existing = applicationMap.get(app.user_id) || { total: 0, pending: 0 };
      existing.total++;
      if (['submitted', 'under_review'].includes(app.status)) {
        existing.pending++;
      }
      applicationMap.set(app.user_id, existing);
    }

    // Merge data
    const enrichedStudents = students?.map(student => ({
      ...student,
      applications: applicationMap.get(student.id) || { total: 0, pending: 0 },
    }));

    return NextResponse.json({
      students: enrichedStudents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('Error in students API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/students - Create a new student (admin only)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      full_name,
      password,
      role = 'student',
      partner_id,
      nationality,
      date_of_birth,
      gender,
      passport_number,
      passport_expiry_date,
      current_address,
      permanent_address,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      highest_education,
      institution_name,
      field_of_study,
      graduation_date,
      gpa,
      hsk_level,
      hsk_score,
      ielts_score,
      toefl_score,
      personal_statement,
      study_plan,
      admin_notes,
    } = body;

    // Validate required fields
    if (!email || !full_name || !password) {
      return NextResponse.json(
        { error: 'Email, full name, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Create auth user first
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
      email,
      password,
    });

    if (signUpError || !authData.user) {
      console.error('Error creating auth user:', signUpError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Create user in users table
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role,
        referred_by_partner_id: partner_id || null,
      })
      .select('*')
      .single();

    if (userError) {
      console.error('Error creating user record:', userError);
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    // Create student record in students table
    const { data: newStudent, error: studentError } = await supabaseAdmin
      .from('students')
      .insert({
        id: crypto.randomUUID(),
        user_id: authData.user.id,
        nationality: nationality || null,
        date_of_birth: date_of_birth || null,
        gender: gender || null,
        passport_number: passport_number || null,
        passport_expiry_date: passport_expiry_date || null,
        highest_education: highest_education || null,
        institution_name: institution_name || null,
        field_of_study: field_of_study || null,
        graduation_date: graduation_date || null,
        gpa: gpa ? parseFloat(gpa) : null,
        hsk_level: hsk_level ? parseInt(hsk_level) : null,
        hsk_score: hsk_score ? parseInt(hsk_score) : null,
        ielts_score: ielts_score ? parseFloat(ielts_score) : null,
        toefl_score: toefl_score ? parseInt(toefl_score) : null,
        partner_id: partner_id || null,
      })
      .select('*')
      .single();

    if (studentError) {
      console.error('Error creating student record:', studentError);
    }

    return NextResponse.json({
      student: {
        ...newUser,
        student: newStudent,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in admin students POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
