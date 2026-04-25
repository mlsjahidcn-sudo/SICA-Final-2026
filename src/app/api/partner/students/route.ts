import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';
import type { StudentsListParams, StudentStats } from '@/app/(partner-v2)/partner-v2/students/lib/types';

/**
 * GET /api/partner/students - List students for the authenticated partner
 * Supports pagination, search, and filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { searchParams } = request.nextUrl;

    // Parse query parameters
    const params: StudentsListParams = {
      page: Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1),
      limit: Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20)),
      search: searchParams.get('search') || '',
      nationality: searchParams.get('nationality') || '',
      status: searchParams.get('status') || '',
    };
    const offset = (params.page - 1) * params.limit;

    // Determine access scope based on partner role
    // Get full user info including partner_role
    const { data: fullUser } = await supabase
      .from('users')
      .select('id, partner_role, partner_id')
      .eq('id', user.id)
      .single();

    const isAdmin = !fullUser?.partner_role || fullUser.partner_role === 'partner_admin';

    // Build visibility filter
    let referrerIds: string[];
    if (isAdmin) {
      // Admin sees students from all team members + themselves
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('role', 'partner');
      referrerIds = (teamMembers || []).map(m => m.id);
      if (!referrerIds.includes(user.id)) referrerIds.push(user.id);
    } else {
      referrerIds = [user.id];
    }

    // Build base query for student users
    // Admin partners can ONLY see students from their team (no null referrers)
    // Students with referred_by_partner_id = null are system/unassigned students - 
    // they should not be visible to regular partner admins for privacy
    
    // Guard: if no referrerIds (shouldn't happen but safety check)
    if (referrerIds.length === 0) {
      return NextResponse.json({
        students: [],
        pagination: { page: params.page, limit: params.limit, total: 0, totalPages: 0 },
        stats: { total: 0, active: 0, pending: 0, inactive: 0 },
      });
    }

    let userQuery = supabase
      .from('users')
      .select('id', { count: 'exact' })
      .in('referred_by_partner_id', referrerIds)
      .eq('role', 'student');

    // Apply search filter
    if (params.search) {
      userQuery = userQuery.or(
        `full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`
      );
    }

    // Apply nationality filter (using 'country' column in users table)
    if (params.nationality && params.nationality !== 'all') {
      userQuery = userQuery.ilike('country', params.nationality);
    }

    // Apply status filter
    if (params.status === 'active') {
      userQuery = userQuery.eq('is_active', true);
    } else if (params.status === 'inactive') {
      userQuery = userQuery.eq('is_active', false);
    }

    // Get paginated results
    const { data: studentUsers, count: totalCount, error: usersError } = await userQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + params.limit - 1);

    if (usersError) {
      console.error('Error fetching student users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // If no student users found, return empty result
    if (!studentUsers || studentUsers.length === 0) {
      const stats = await calculateStats(supabase, referrerIds);
      return NextResponse.json({
        students: [],
        pagination: {
          page: params.page,
          limit: params.limit,
          total: 0,
          totalPages: 0,
        },
        stats,
      });
    }

    const userIds = studentUsers.map(u => u.id);

    // Fetch detailed student data from users table with all fields
    const { data: studentsDetail, error: detailError } = await supabase
      .from('users')
      .select('*')
      .in('id', userIds)
      .order('created_at', { ascending: false });

    if (detailError) {
      console.error('Error fetching student details:', detailError);
      return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 });
    }

    // Get application counts for each student
    // First get student records from students table
    const { data: studentRecords } = await supabase
      .from('students')
      .select('id, user_id')
      .in('user_id', userIds);

    const userIdToStudentId = new Map<string, string>();
    (studentRecords || []).forEach(s => {
      if (s.user_id) userIdToStudentId.set(s.user_id, s.id);
    });

    const studentIds = Array.from(userIdToStudentId.values());

    // Get applications grouped by student_id
    const appCounts: Record<string, { total: number; pending: number; approved: number; rejected: number }> = {};
    
    if (studentIds.length > 0) {
      const { data: applications } = await supabase
        .from('applications')
        .select('student_id, status')
        .in('student_id', studentIds);

      (applications || []).forEach(app => {
        if (!appCounts[app.student_id]) {
          appCounts[app.student_id] = { total: 0, pending: 0, approved: 0, rejected: 0 };
        }
        appCounts[app.student_id].total++;
        switch (app.status) {
          case 'submitted':
          case 'under_review':
          case 'document_request':
          case 'interview_scheduled':
            appCounts[app.student_id].pending++;
            break;
          case 'accepted':
            appCounts[app.student_id].approved++;
            break;
          case 'rejected':
          case 'withdrawn':
            appCounts[app.student_id].rejected++;
            break;
        }
      });
    }

    // Format response
    const students = (studentsDetail || []).map(u => ({
      id: u.id,
      user_id: u.id,
      email: u.email,
      full_name: u.full_name,
      phone: u.phone,
      avatar_url: u.avatar_url,
      nationality: u.country,
      gender: u.gender,
      is_active: u.is_active ?? true,
      passport_number: u.passport_number,
      referred_by_partner_id: u.referred_by_partner_id,
      created_at: u.created_at,
      updated_at: u.updated_at,
      applications: appCounts[userIdToStudentId.get(u.id) || ''] || {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    }));

    // Calculate stats
    const stats = await calculateStats(supabase, referrerIds);

    const totalPages = Math.ceil((totalCount || 0) / params.limit);

    return NextResponse.json({
      students,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: totalCount || 0,
        totalPages,
      },
      stats,
    });

  } catch (error) {
    console.error('Students list API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/partner/students - Create a new student
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requirePartner(request);
    
    if (user instanceof NextResponse) {
      return user;
    }

    const body = await request.json();
    const supabase = getSupabaseClient();

    // Basic checks - only email and full_name required
    if (!body.email || !body.full_name) {
      return NextResponse.json({
        error: 'Email and full name are required',
      }, { status: 400 });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .ilike('email', body.email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Build user record from body directly (no Zod stripping)
    const userRecord: Record<string, unknown> = {
      email: body.email,
      role: 'student',
      full_name: body.full_name,
      is_active: true,
      referred_by_partner_id: user.id,
      created_by: user.id, // Track which team member created this student
    };

    // Map all optional fields if provided (only fields that exist in users table)
    const optionalFields = [
      'phone', 'nationality', 'gender', 'date_of_birth', 'chinese_name',
      'marital_status', 'religion', 'current_address', 'permanent_address',
      'postal_code', 'city', 'country', 'wechat_id',
      'emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship',
      'passport_number', 'passport_expiry_date', 'passport_issuing_country',
      'highest_education', 'institution_name',
      'graduation_date', 'hsk_level', 'hsk_score', 'ielts_score', 'toefl_score',
      'study_mode', 'funding_source', 'scholarship_application',
    ];

    for (const field of optionalFields) {
      if (body[field] !== undefined && body[field] !== '') {
        userRecord[field] = body[field] || null;
      }
    }

    // Note: field_of_study and gpa exist only in students table, not users table
    // They will be set when creating/updating the student record

    // Create user record (or skip for orphan mode)
    let newUserId: string | null = null;

    if (!body.skip_user_creation) {
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: body.email,
        password: body.password || Math.random().toString(36).slice(-12),
        email_confirm: false,
        user_metadata: {
          role: 'student',
          full_name: body.full_name,
          referred_by_partner_id: user.id,
        },
      });

      if (createUserError || !newUser.user) {
        console.error('Error creating auth user:', createUserError);
        return NextResponse.json(
          { error: 'Failed to create user account', details: { message: createUserError?.message || 'Unknown error' } },
          { status: 500 }
        );
      }

      newUserId = newUser.user.id;
      userRecord.id = newUserId;

      // Create users table record
      const { error: insertUserError } = await supabase.from('users').insert(userRecord);

      if (insertUserError) {
        console.error('Error inserting user record:', insertUserError);
        await supabase.auth.admin.deleteUser(newUserId);
        return NextResponse.json(
          { error: 'Failed to create student record', details: { message: insertUserError?.message || 'Unknown error' } },
          { status: 500 }
        );
      }
    } else {
      // Orphan mode: generate a UUID for reference but no auth account
      newUserId = crypto.randomUUID();
      userRecord.id = newUserId;

      const { error: insertUserError } = await supabase.from('users').insert(userRecord);

      if (insertUserError) {
        console.error('Error inserting orphan user record:', insertUserError);
        return NextResponse.json(
          { error: 'Failed to create student record', details: { message: insertUserError?.message || 'Unknown error' } },
          { status: 500 }
        );
      }
    }

    // Also create students table entry if it exists separately
    try {
      await supabase.from('students').insert({
        user_id: newUserId,
        first_name: body.full_name.split(' ')[0] || '',
        last_name: body.full_name.split(' ').slice(1).join(' ') || '',
        nationality: body.nationality || null,
      });
    } catch (studentsTableError) {
      console.log('Note: Could not create students table entry (may be expected):', studentsTableError);
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUserId,
        message: 'Student created successfully',
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Create student API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Calculate statistics for the students dashboard
 */
async function calculateStats(
  supabase: ReturnType<typeof getSupabaseClient>,
  referrerIds: string[]
): Promise<StudentStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Total students count
  const { count: total } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .in('referred_by_partner_id', referrerIds)
    .eq('role', 'student');

  // Active students count
  const { count: active } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .in('referred_by_partner_id', referrerIds)
    .eq('role', 'student')
    .eq('is_active', true);

  // New this month
  const { count: newThisMonth } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .in('referred_by_partner_id', referrerIds)
    .eq('role', 'student')
    .gte('created_at', startOfMonth.toISOString());

  // With applications - need to check via student records
  const { data: studentUsers } = await supabase
    .from('users')
    .select('id')
    .in('referred_by_partner_id', referrerIds)
    .eq('role', 'student');

  const userIds = (studentUsers || []).map(u => u.id);
  let withApplications = 0;

  if (userIds.length > 0) {
    const { data: studentRecords } = await supabase
      .from('students')
      .select('id')
      .in('user_id', userIds);

    const studentIds = (studentRecords || []).map(s => s.id);

    if (studentIds.length > 0) {
      const { count: appsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('student_id', studentIds)
        .neq('status', 'draft');

      withApplications = appsCount || 0;
    }
  }

  return {
    total: total || 0,
    active: active || 0,
    newThisMonth: newThisMonth || 0,
    withApplications,
  };
}
