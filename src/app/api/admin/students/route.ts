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
    const source = searchParams.get('source') || 'all'; // 'all' | 'individual' | 'partner_referred'
    const nationality = searchParams.get('nationality') || '';
    const offset = (page - 1) * limit;

    // Query 1: Students with user accounts (from users table with role='student')
    let query = supabaseAdmin
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        avatar_url,
        is_active,
        created_at,
        updated_at,
        referred_by_partner_id,
        students (
          id,
          first_name,
          last_name,
          nationality,
          passport_number,
          date_of_birth,
          gender,
          current_address,
          wechat_id
        )
      `, { count: 'exact' })
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Note: nationality is on the students table, not users table.
    // We filter nationality in-memory after fetching.

    // Apply source filter
    if (source === 'individual') {
      query = query.is('referred_by_partner_id', null);
    } else if (source === 'partner_referred') {
      query = query.not('referred_by_partner_id', 'is', null);
    }

    const { data: students, error, count } = await query;

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Query 2: Students without user accounts (orphan students)
    // These are students where user_id is null
    let orphanQuery = supabaseAdmin
      .from('students')
      .select('id, user_id, nationality, gender, current_address, wechat_id, created_at', { count: 'exact' })
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (search) {
      // Search in admin_notes or other fields for orphan students
      orphanQuery = orphanQuery.or(`admin_notes.ilike.%${search}%`);
    }

    const { data: orphanStudents, error: orphanError, count: orphanCount } = await orphanQuery;

    if (orphanError) {
      console.error('Error fetching orphan students:', orphanError);
      // Don't fail the whole request, just log the error
    }

    // Get partner info for referred students
    const referredPartnerIds = students
      ?.filter(s => s.referred_by_partner_id)
      .map(s => s.referred_by_partner_id) || [];

    const partnerMap = new Map<string, { full_name: string; email: string; company_name?: string }>();

    if (referredPartnerIds.length > 0) {
      // Fetch partner user info
      const uniquePartnerIds = [...new Set(referredPartnerIds)];
      const { data: partnerUsers } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email')
        .in('id', uniquePartnerIds);

      // Also fetch partner company info
      const { data: partnerRecords } = await supabaseAdmin
        .from('partners')
        .select('user_id, company_name')
        .in('user_id', uniquePartnerIds);

      const partnerCompanyMap = new Map<string, string>();
      for (const pr of (partnerRecords || [])) {
        partnerCompanyMap.set(pr.user_id, pr.company_name);
      }

      for (const pu of (partnerUsers || [])) {
        partnerMap.set(pu.id, {
          full_name: pu.full_name,
          email: pu.email,
          company_name: partnerCompanyMap.get(pu.id),
        });
      }
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

    // Merge data - extract nationality from students join
    let enrichedStudents: Array<Record<string, unknown>> = students?.map(student => {
      // students is an array or single object depending on the join
      const studentRecord = Array.isArray(student.students) ? student.students[0] : student.students;
      return {
        ...student,
        nationality: studentRecord?.nationality || null,
        source: student.referred_by_partner_id ? 'partner_referred' as const : 'individual' as const,
        referred_by_partner: student.referred_by_partner_id
          ? partnerMap.get(student.referred_by_partner_id) || null
          : null,
        applications: applicationMap.get(student.id) || { total: 0, pending: 0 },
        has_user_account: true,
      };
    }) || [];

    // Add orphan students (students without user accounts)
    if (orphanStudents && orphanStudents.length > 0) {
      const formattedOrphanStudents = orphanStudents.map(orphan => ({
        id: orphan.id,
        email: null,
        full_name: 'Unknown (No User Account)', // No user account, so no name
        phone: null,
        avatar_url: null,
        is_active: true,
        created_at: orphan.created_at,
        updated_at: null,
        referred_by_partner_id: null,
        nationality: orphan.nationality,
        gender: orphan.gender,
        current_address: orphan.current_address,
        wechat_id: orphan.wechat_id,
        source: 'orphan' as const,
        referred_by_partner: null,
        applications: { total: 0, pending: 0 },
        has_user_account: false,
        students: [], // Empty since no user account
      }));
      enrichedStudents = [...enrichedStudents, ...formattedOrphanStudents];
    }

    // Apply nationality filter in-memory (nationality is on students table, not users)
    if (nationality) {
      enrichedStudents = enrichedStudents.filter(s => {
        const sNationality = s.nationality as string | null;
        return sNationality?.toLowerCase() === nationality.toLowerCase();
      });
    }

    // Compute stats
    const totalStudents = count || 0;
    let individualCount = 0;
    let partnerReferredCount = 0;

    // Get counts for stats (efficient count query)
    if (source === 'all') {
      const { count: indCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .is('referred_by_partner_id', null);
      individualCount = indCount || 0;
      partnerReferredCount = totalStudents - individualCount;
    } else if (source === 'individual') {
      individualCount = totalStudents;
      // Get partner count separately
      const { count: pCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .not('referred_by_partner_id', 'is', null);
      partnerReferredCount = pCount || 0;
    } else {
      partnerReferredCount = totalStudents;
      const { count: iCount } = await supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .is('referred_by_partner_id', null);
      individualCount = iCount || 0;
    }

    // Active students count
    const { count: activeCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('is_active', true);

    // New this month count
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newThisMonthCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .gte('created_at', startOfMonth.toISOString());

    return NextResponse.json({
      students: enrichedStudents,
      pagination: {
        page,
        limit,
        total: (count || 0) + (orphanCount || 0),
        totalPages: Math.ceil(((count || 0) + (orphanCount || 0)) / limit),
      },
      stats: {
        total: individualCount + partnerReferredCount + (orphanCount || 0),
        individual: individualCount,
        partnerReferred: partnerReferredCount,
        orphan: orphanCount || 0,
        active: activeCount || 0,
        newThisMonth: newThisMonthCount || 0,
        withApplications: applicationMap.size,
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
      phone,
      wechat_id,
      skip_user_creation = false, // Flag to skip user account creation
    } = body;

    // Validate required fields based on mode
    if (skip_user_creation) {
      // Only require full_name when skipping user creation
      if (!full_name) {
        return NextResponse.json(
          { error: 'Full name is required' },
          { status: 400 }
        );
      }
    } else {
      // Require email, full_name, and password when creating user account
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
    }

    let userId: string | null = null;
    let newUser: Record<string, unknown> | null = null;

    // Only create user account if not skipping
    if (!skip_user_creation) {
      // Create auth user first
      const { data: authData, error: signUpError } = await supabaseAdmin.auth.signUp({
        email,
        password,
      });

      if (signUpError || !authData.user) {
        console.error('Error creating auth user:', signUpError);
        return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
      }

      userId = authData.user.id;

      // Create user in users table
      const { data: createdUser, error: userError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email,
          full_name,
          role,
          phone: phone || null,
          referred_by_partner_id: partner_id || null,
        })
        .select('*')
        .single();

      if (userError) {
        console.error('Error creating user record:', userError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      newUser = createdUser;
    }

    // Create student record in students table
    // Only use columns that are known to work with PostgREST schema cache
    const studentId = crypto.randomUUID();
    const studentInsertData: Record<string, unknown> = {
      id: studentId,
      user_id: userId, // Will be null if skip_user_creation is true
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add optional fields only if they have values
    if (nationality) studentInsertData.nationality = nationality;
    if (gender) studentInsertData.gender = gender;
    if (date_of_birth) studentInsertData.date_of_birth = date_of_birth;
    if (passport_number) studentInsertData.passport_number = passport_number;
    if (passport_expiry_date) studentInsertData.passport_expiry_date = passport_expiry_date;
    if (current_address) studentInsertData.current_address = current_address;
    if (permanent_address) studentInsertData.permanent_address = permanent_address;
    if (wechat_id) studentInsertData.wechat_id = wechat_id;
    if (emergency_contact_name) studentInsertData.emergency_contact_name = emergency_contact_name;
    if (emergency_contact_phone) studentInsertData.emergency_contact_phone = emergency_contact_phone;
    if (emergency_contact_relationship) studentInsertData.emergency_contact_relationship = emergency_contact_relationship;
    if (highest_education) studentInsertData.highest_education = highest_education;
    if (institution_name) studentInsertData.institution_name = institution_name;
    if (field_of_study) studentInsertData.field_of_study = field_of_study;
    if (graduation_date) studentInsertData.graduation_date = graduation_date;
    if (gpa) studentInsertData.gpa = gpa;
    if (hsk_level) studentInsertData.hsk_level = parseInt(hsk_level);
    if (hsk_score) studentInsertData.hsk_score = parseInt(hsk_score);
    if (ielts_score) studentInsertData.ielts_score = ielts_score;
    if (toefl_score) studentInsertData.toefl_score = parseInt(toefl_score);

    const { data: newStudent, error: studentError } = await supabaseAdmin
      .from('students')
      .insert(studentInsertData)
      .select('id, nationality, gender, highest_education, created_at')
      .single();

    if (studentError) {
      console.error('Error creating student record:', studentError);
      return NextResponse.json({ error: 'Failed to create student record', details: studentError.message }, { status: 500 });
    }

    return NextResponse.json({
      student: {
        id: studentId,
        full_name,
        email: email || null,
        phone: phone || null,
        user_id: userId,
        user: newUser,
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
