import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { PartnerStudent } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/partner-students
 * Fetch students referred by partners (referred_by_partner_id IS NOT NULL)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const nationality = searchParams.get('nationality') || '';
    const partner_id = searchParams.get('partner_id') || ''; // Filter by specific partner
    const status = searchParams.get('status') || ''; // active/inactive filter
    const id = searchParams.get('id') || ''; // Single student lookup by ID
    const offset = (page - 1) * limit;

    // Single record lookup mode (for detail pages)
    if (id) {
      // First try: exact match with partner-referred filter
      const { data: singleStudent, error: singleError } = await supabaseAdmin
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
          created_by,
          updated_by,
          country,
          city,
          students!left (
            id,
            first_name,
            last_name,
            nationality,
            passport_number,
            date_of_birth,
            gender,
            current_address,
            wechat_id,
            highest_education,
            institution_name
          )
        `)
        .eq('id', id)
        .eq('role', 'student')
        .single();

      // If not found with strict filter, try broader lookup (student may not have referred_by_partner_id)
      let finalStudent = singleStudent;
      if (singleError || !singleStudent) {
        const { data: fallbackStudent, error: fallbackError } = await supabaseAdmin
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
            created_by,
            updated_by,
            country,
            city,
            students!left (
              id,
              first_name,
              last_name,
              nationality,
              passport_number,
              date_of_birth,
              gender,
              current_address,
              wechat_id,
              highest_education,
              institution_name
            )
          `)
          .eq('id', id)
          .eq('role', 'student')
          .single();

        if (fallbackError || !fallbackStudent) {
          console.error('Student lookup failed:', { id, singleError: singleError?.message, fallbackError: fallbackError?.message });
          return NextResponse.json({ error: 'Student not found', details: singleError?.message || fallbackError?.message }, { status: 404 });
        }
        finalStudent = fallbackStudent;
      }

      // At this point finalStudent is guaranteed to be non-null due to early returns above
      if (!finalStudent) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      // Get partner info for referred_by_partner, created_by, and updated_by
      const allPartnerIds: string[] = [
        finalStudent.referred_by_partner_id,
        (finalStudent as Record<string, unknown>).created_by as string,
        (finalStudent as Record<string, unknown>).updated_by as string,
      ].filter(Boolean) as string[];

      const partnerInfoMap = new Map<string, { id: string; full_name: string; email: string; company_name?: string }>();

      if (allPartnerIds.length > 0) {
        const { data: partnerUsers } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .in('id', allPartnerIds);

        const { data: partnerRecords } = await supabaseAdmin
          .from('partners')
          .select('user_id, company_name')
          .in('user_id', allPartnerIds);

        const partnerCompanyMap = new Map<string, string>();
        for (const pr of (partnerRecords || [])) {
          partnerCompanyMap.set(pr.user_id, pr.company_name);
        }

        for (const pu of (partnerUsers || [])) {
          partnerInfoMap.set(pu.id, {
            id: pu.id,
            full_name: pu.full_name,
            email: pu.email,
            company_name: partnerCompanyMap.get(pu.id),
          });
        }
      }

      const studentRecord = Array.isArray(finalStudent.students) ? finalStudent.students[0] : finalStudent.students;

      return NextResponse.json({
        student: {
          id: finalStudent.id,
          user_id: finalStudent.id,
          email: finalStudent.email,
          full_name: finalStudent.full_name,
          phone: finalStudent.phone,
          avatar_url: finalStudent.avatar_url,
          is_active: finalStudent.is_active,
          source: 'partner_referred' as const,
          referred_by_partner_id: finalStudent.referred_by_partner_id,
          referred_by_partner: finalStudent.referred_by_partner_id
            ? partnerInfoMap.get(finalStudent.referred_by_partner_id) || null
            : null,
          created_by: (finalStudent as Record<string, unknown>).created_by as string | null,
          created_by_partner: (finalStudent as Record<string, unknown>).created_by as string
            ? partnerInfoMap.get((finalStudent as Record<string, unknown>).created_by as string) || null
            : null,
          updated_by: (finalStudent as Record<string, unknown>).updated_by as string | null,
          updated_by_partner: (finalStudent as Record<string, unknown>).updated_by as string
            ? partnerInfoMap.get((finalStudent as Record<string, unknown>).updated_by as string) || null
            : null,
          nationality: studentRecord?.nationality || null,
          gender: studentRecord?.gender || null,
          date_of_birth: studentRecord?.date_of_birth || null,
          country: finalStudent.country || null,
          city: finalStudent.city || null,
          current_address: studentRecord?.current_address || null,
          wechat_id: studentRecord?.wechat_id || null,
          passport_number: studentRecord?.passport_number || null,
          highest_education: studentRecord?.highest_education || null,
          institution_name: studentRecord?.institution_name || null,
          created_at: finalStudent.created_at,
          updated_at: finalStudent.updated_at,
        },
      });
    }

    // Query partner-referred students
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
        created_by,
        updated_by,
        country,
        city,
        students!left (
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
      .not('referred_by_partner_id', 'is', null) // Only partner-referred students
      .order('created_at', { ascending: false });

    // Filter by specific partner if provided
    if (partner_id) {
      query = query.eq('referred_by_partner_id', partner_id);
    }

    // Apply status filter at database level (before pagination)
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: allStudents, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching partner students:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Apply nationality filter BEFORE pagination
    let filteredStudents = allStudents || [];
    if (nationality) {
      filteredStudents = filteredStudents.filter(s => {
        const sr = Array.isArray(s.students) ? s.students[0] : s.students;
        return sr?.nationality?.toLowerCase() === nationality.toLowerCase();
      });
    }

    // Manual pagination (after all filters)
    const paginatedStudents = filteredStudents.slice(offset, offset + limit);
    
    // Get total count matching current filters (not raw count)
    // Build base count query with same filters as data query
    let countQuery = supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .not('referred_by_partner_id', 'is', null);
    
    if (partner_id) countQuery = countQuery.eq('referred_by_partner_id', partner_id);
    if (status === 'active') countQuery = countQuery.eq('is_active', true);
    else if (status === 'inactive') countQuery = countQuery.eq('is_active', false);
    if (search) countQuery = countQuery.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    
    const { count: totalCount } = await countQuery;

    // Get partner info for referred_by_partner, created_by, and updated_by
    const allPartnerIds = [
      ...new Set([
        ...(allStudents?.map(s => s.referred_by_partner_id).filter(Boolean) || []),
        ...(allStudents?.map(s => (s as Record<string, unknown>).created_by).filter(Boolean) || []),
        ...(allStudents?.map(s => (s as Record<string, unknown>).updated_by).filter(Boolean) || []),
      ])
    ] as string[];

    const { data: partnerUsers } = allPartnerIds.length > 0
      ? await supabaseAdmin
          .from('users')
          .select('id, full_name, email')
          .in('id', allPartnerIds)
      : { data: [] };

    const { data: partnerRecords } = allPartnerIds.length > 0
      ? await supabaseAdmin
          .from('partners')
          .select('user_id, company_name')
          .in('user_id', allPartnerIds)
      : { data: [] };

    const partnerMap = new Map<string, { id: string; full_name: string; email: string; company_name?: string }>();
    const partnerCompanyMap = new Map<string, string>();

    for (const pr of (partnerRecords || [])) {
      partnerCompanyMap.set(pr.user_id, pr.company_name);
    }

    for (const pu of (partnerUsers || [])) {
      partnerMap.set(pu.id, {
        id: pu.id,
        full_name: pu.full_name,
        email: pu.email,
        company_name: partnerCompanyMap.get(pu.id),
      });
    }

    // Get application counts using student_id (applications uses student_id, not user_id)
    const userToStudentMap = new Map<string, string>();
    for (const s of (allStudents || [])) {
      const studentRecord = Array.isArray(s.students) ? s.students[0] : s.students;
      if (s.id && studentRecord?.id) {
        userToStudentMap.set(s.id, studentRecord.id);
      }
    }
    const studentRecordIds = [...new Set(userToStudentMap.values())];
    
    const { data: applicationCounts } = studentRecordIds.length > 0
      ? await supabaseAdmin
          .from('applications')
          .select('student_id, status')
          .in('student_id', studentRecordIds)
      : { data: [] };

    const applicationMap = new Map<string, { total: number; pending: number }>();
    // Reverse map: student_record.id -> user.id
    const studentIdToUserId = new Map<string, string>();
    for (const [userId, studentRecordId] of userToStudentMap.entries()) {
      studentIdToUserId.set(studentRecordId, userId);
    }
    
    for (const app of (applicationCounts || [])) {
      const userId = studentIdToUserId.get(app.student_id);
      if (!userId) continue;
      const existing = applicationMap.get(userId) || { total: 0, pending: 0 };
      existing.total++;
      if (['submitted', 'under_review'].includes(app.status)) {
        existing.pending++;
      }
      applicationMap.set(userId, existing);
    }

    // Transform to PartnerStudent type (already filtered & paginated)
    const enrichedStudents: PartnerStudent[] = paginatedStudents.map(student => {
      const studentRecord = Array.isArray(student.students) ? student.students[0] : student.students;
      const createdBy = (student as Record<string, unknown>).created_by as string | null;
      const updatedBy = (student as Record<string, unknown>).updated_by as string | null;
      return {
        id: student.id,
        user_id: student.id,
        email: student.email,
        full_name: student.full_name,
        phone: student.phone,
        avatar_url: student.avatar_url,
        is_active: student.is_active,
        source: 'partner_referred' as const,
        referred_by_partner_id: student.referred_by_partner_id,
        referred_by_partner: student.referred_by_partner_id
          ? partnerMap.get(student.referred_by_partner_id) || null
          : null,
        created_by: createdBy,
        created_by_partner: createdBy ? partnerMap.get(createdBy) || null : null,
        updated_by: updatedBy,
        updated_by_partner: updatedBy ? partnerMap.get(updatedBy) || null : null,
        nationality: studentRecord?.nationality || null,
        gender: studentRecord?.gender || null,
        created_at: student.created_at,
        updated_at: student.updated_at,
        applications: applicationMap.get(student.id) || { total: 0, pending: 0 },
      };
    });

    // Get stats - always global (not filtered by current view)
    const { count: activeCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .not('referred_by_partner_id', 'is', null)
      .eq('is_active', true);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const { count: newThisMonthCount } = await supabaseAdmin
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .not('referred_by_partner_id', 'is', null)
      .gte('created_at', startOfMonth.toISOString());

    return NextResponse.json({
      students: enrichedStudents,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
      },
      stats: {
        total: totalCount || 0,
        active: activeCount || 0,
        newThisMonth: newThisMonthCount || 0,
        withApplications: applicationMap.size,
      },
    });
  } catch (error) {
    console.error('Error in partner students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/partner-students
 * Admin creates a new student and assigns them to a partner.
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const body = await request.json();
    const supabaseAdmin = getSupabaseClient();

    const {
      email,
      full_name,
      partner_id,
      phone,
      nationality,
      gender,
      date_of_birth,
      passport_number,
      country,
      city,
      current_address,
      wechat_id,
      highest_education,
      institution_name,
    } = body;

    // Validate required fields
    if (!email || !full_name) {
      return NextResponse.json(
        { error: 'Email and full name are required' },
        { status: 400 }
      );
    }

    if (!partner_id) {
      return NextResponse.json(
        { error: 'Partner ID is required. Please select which partner this student belongs to.' },
        { status: 400 }
      );
    }

    // Verify partner exists and is approved
    const { data: partnerUser, error: partnerError } = await supabaseAdmin
      .from('users')
      .select('id, role, approval_status')
      .eq('id', partner_id)
      .single();

    if (partnerError || !partnerUser) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    if (partnerUser.role !== 'partner') {
      return NextResponse.json(
        { error: 'Selected user is not a partner' },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Generate random password for the new student account
    const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-4);

    // Create auth user
    const { data: newUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: false,
      user_metadata: {
        role: 'student',
        full_name,
        referred_by_partner_id: partner_id,
      },
    });

    if (createAuthError || !newUser?.user) {
      console.error('Error creating auth user:', createAuthError);
      return NextResponse.json(
        { error: 'Failed to create user account', details: { message: createAuthError?.message || 'Unknown error' } },
        { status: 500 }
      );
    }

    const newUserId = newUser.user.id;

    // Create users table record
    const userRecord: Record<string, unknown> = {
      id: newUserId,
      email,
      role: 'student',
      full_name,
      is_active: true,
      referred_by_partner_id: partner_id,
    };

    // Set optional fields only if provided
    if (phone) userRecord.phone = phone;
    if (nationality) userRecord.nationality = nationality;
    if (gender) userRecord.gender = gender;
    if (date_of_birth) userRecord.date_of_birth = date_of_birth;
    if (passport_number) userRecord.passport_number = passport_number;
    if (country) userRecord.country = country;
    if (city) userRecord.city = city;
    if (current_address) userRecord.current_address = current_address;
    if (wechat_id) userRecord.wechat_id = wechat_id;
    if (highest_education) userRecord.highest_education = highest_education;
    if (institution_name) userRecord.institution_name = institution_name;

    const { error: insertUserError } = await supabaseAdmin
      .from('users')
      .insert(userRecord);

    if (insertUserError) {
      console.error('Error inserting user record:', insertUserError);
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json(
        { error: 'Failed to create student record', details: { message: insertUserError.message || 'Unknown error' } },
        { status: 500 }
      );
    }

    // Create students table entry
    const nameParts = full_name.split(' ');
    const { error: studentInsertError } = await supabaseAdmin.from('students').insert({
      user_id: newUserId,
      first_name: nameParts[0] || '',
      last_name: nameParts.slice(1).join(' ') || '',
      nationality: nationality || null,
      gender: gender || null,
    });

    if (studentInsertError) {
      console.log('Note: Could not create students table entry:', studentInsertError.message);
      // Non-critical - user record was created successfully
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUserId,
        email,
        full_name,
        message: 'Student created successfully and assigned to partner',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin student:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
