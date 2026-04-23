import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth, getPartnerAdminId } from '@/lib/partner/roles';

/**
 * GET /api/partner/applications
 * Fetch applications for the current partner (students they referred)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;

    const partnerUser = authResult.user;
    const supabase = getSupabaseClient();

    // Get partner admin ID (for team members, use admin's ID)
    const adminId = await getPartnerAdminId(partnerUser.id);
    const effectivePartnerId = adminId || partnerUser.id;

    // Get partner record ID from partners table
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', effectivePartnerId)
      .maybeSingle();

    const partnerRecordId = partnerRecord?.id || null;

    // Get all students referred by this partner (via referred_by_partner_id on users table)
    const { data: referredUsers, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('referred_by_partner_id', effectivePartnerId);

    if (usersError) {
      console.error('Error fetching referred users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch partner data' }, { status: 500 });
    }

    const referredUserIds = (referredUsers || []).map(u => u.id);

    // If no referred students, return empty
    if (referredUserIds.length === 0) {
      return NextResponse.json({
        applications: [],
        total: 0,
        page: 1,
        pageSize: 100,
        hasMore: false,
        limit: 100,
        totalPages: 0,
      });
    }

    // Get student records for these users
    const { data: studentRecords } = await supabase
      .from('students')
      .select('id, user_id')
      .in('user_id', referredUserIds);

    const studentIds = (studentRecords || []).map(s => s.id);
    const studentIdToUserId = new Map<string, string>();
    for (const s of (studentRecords || [])) {
      studentIdToUserId.set(s.id, s.user_id);
    }

    // Get user info for referred students
    const { data: usersData } = await supabase
      .from('users')
      .select('id, full_name, email, phone')
      .in('id', referredUserIds);

    const userMap = new Map(usersData?.map(u => [u.id, u]) || []);

    // Fetch applications for these students
    const { data: applications, error, count } = await supabase
      .from('applications')
      .select(
        'id, status, priority, notes, submitted_at, created_at, updated_at, profile_snapshot, student_id, program_id',
        { count: 'exact' }
      )
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching partner applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Fetch programs
    const programIds = [...new Set(applications?.map(a => a.program_id).filter(Boolean) || [])];
    const { data: programsData } = programIds.length > 0
      ? await supabase
          .from('programs')
          .select('id, name, degree_level, duration_years, university_id')
          .in('id', programIds)
      : { data: [] };

    // Fetch universities
    const universityIds = [...new Set(programsData?.map(p => p.university_id).filter(Boolean) || [])];
    const { data: universitiesData } = universityIds.length > 0
      ? await supabase
          .from('universities')
          .select('id, name_en, name_cn, city, province, logo_url')
          .in('id', universityIds)
      : { data: [] };

    const programMap = new Map(programsData?.map(p => [p.id, p]) || []);
    const universityMap = new Map(universitiesData?.map(u => [u.id, u]) || []);

    // Normalize applications for frontend
    const normalizedApplications = applications?.map(app => {
      const parsedSnapshot = (app.profile_snapshot as Record<string, unknown>) || {};
      const userId = studentIdToUserId.get(app.student_id);
      const userInfo = userId ? userMap.get(userId) : null;

      const program = programMap.get(app.program_id);
      const university = program?.university_id ? universityMap.get(program.university_id) : null;

      return {
        id: app.id,
        status: app.status,
        priority: app.priority,
        notes: app.notes,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        intake: (parsedSnapshot.intake as string) || '',
        personal_statement: (parsedSnapshot.personal_statement as string) || '',
        study_plan: (parsedSnapshot.study_plan as string) || '',
        programs: program
          ? {
              id: program.id,
              name: program.name,
              degree_level: program.degree_level,
              duration: program.duration_years ? `${program.duration_years} years` : null,
              universities: university
                ? {
                    id: university.id,
                    name_en: university.name_en,
                    name_cn: university.name_cn,
                    city: university.city,
                    province: university.province,
                    logo_url: university.logo_url,
                  }
                : null,
            }
          : null,
        students: userInfo
          ? {
              id: app.student_id,
              user_id: userId,
              email: userInfo.email,
              full_name: userInfo.full_name,
              phone: userInfo.phone,
              nationality: null, // Could fetch from students table if needed
            }
          : null,
      };
    }) || [];

    const total = count || 0;

    return NextResponse.json({
      applications: normalizedApplications,
      total,
      page: 1,
      pageSize: 100,
      hasMore: false,
      limit: 100,
      totalPages: Math.ceil(total / 100) || 0,
    });
  } catch (error) {
    console.error('Error in partner applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/partner/applications
 * Partner creates a new application for their referred student
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;

    const partnerUser = authResult.user;
    const supabase = getSupabaseClient();

    const body = await request.json();
    const {
      student_id, // This is users.id from frontend
      program_id,
      selected_program_ids,
      requested_university_program_note,
      intake,
    } = body;

    if (!student_id) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get partner admin ID
    const adminId = await getPartnerAdminId(partnerUser.id);
    const effectivePartnerId = adminId || partnerUser.id;

    // Verify the student is referred by this partner
    const { data: studentUser, error: studentUserError } = await supabase
      .from('users')
      .select('id, role, referred_by_partner_id')
      .eq('id', student_id)
      .single();

    if (studentUserError || !studentUser) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    if (studentUser.role !== 'student') {
      return NextResponse.json({ error: 'Selected user is not a student' }, { status: 400 });
    }

    if (studentUser.referred_by_partner_id !== effectivePartnerId) {
      return NextResponse.json(
        { error: 'You can only create applications for your own referred students' },
        { status: 403 }
      );
    }

    // Get students.id from users.id
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', student_id)
      .maybeSingle();

    const actualStudentId = studentRecord?.id;
    if (!actualStudentId) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    // Get partner record ID
    const { data: partnerRec } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', effectivePartnerId)
      .maybeSingle();

    const partnerRecordId = partnerRec?.id || null;

    // Determine program IDs to create applications for
    const programIdsToCreate: string[] = [];
    if (selected_program_ids && selected_program_ids.length > 0) {
      programIdsToCreate.push(...selected_program_ids);
    } else if (program_id) {
      programIdsToCreate.push(program_id);
    }

    // Validate if programs are provided
    if (programIdsToCreate.length === 0 && !requested_university_program_note) {
      return NextResponse.json(
        { error: 'Either program or request note is required' },
        { status: 400 }
      );
    }

    const createdApplications = [];

    // Create applications for each program
    for (const pid of programIdsToCreate) {
      const { data: newApp, error: insertError } = await supabase
        .from('applications')
        .insert({
          student_id: actualStudentId,
          program_id: pid,
          partner_id: partnerRecordId,
          status: 'draft',
          profile_snapshot: {
            ...(intake ? { intake } : {}),
          },
        })
        .select('id, status, created_at')
        .single();

      if (insertError) {
        console.error(`Error creating application for program ${pid}:`, insertError);
        continue;
      }

      createdApplications.push(newApp);
    }

    // Create a request-only application if no programs selected
    if (programIdsToCreate.length === 0 && requested_university_program_note) {
      const { data: newApp, error: insertError } = await supabase
        .from('applications')
        .insert({
          student_id: actualStudentId,
          partner_id: partnerRecordId,
          status: 'draft',
          notes: requested_university_program_note,
          profile_snapshot: {
            ...(intake ? { intake } : {}),
          },
        })
        .select('id, status, created_at')
        .single();

      if (insertError) {
        console.error('Error creating request application:', insertError);
      } else {
        createdApplications.push(newApp);
      }
    }

    if (createdApplications.length === 0) {
      return NextResponse.json({ error: 'Failed to create any applications' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      applications: createdApplications,
    }, { status: 201 });
  } catch (error) {
    console.error('Error in partner applications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
