import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { ApplicationWithPartner } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/individual-applications
 * Fetch applications from individual students (partner_id IS NULL)
 *
 * Query params: page, limit, status, university/university_id, degree_type/degree_level, search, id
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Support ?id= for single record lookup (backward compatibility)
    // Redirects to the dedicated [id] endpoint for step-by-step fetching
    const idParam = searchParams.get('id');
    if (idParam) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(idParam)) {
        return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
      }

      // Use step-by-step queries (same as [id]/route.ts GET handler)
      const { data: app, error: appError } = await supabaseAdmin
        .from('applications')
        .select('id, status, priority, notes, submitted_at, created_at, updated_at, partner_id, student_id, program_id, profile_snapshot')
        .eq('id', idParam)
        .single();

      if (appError || !app) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      if (app.partner_id) {
        return NextResponse.json({ error: 'This endpoint is for individual applications only' }, { status: 403 });
      }

      const snapshot = app.profile_snapshot as Record<string, unknown> | null;

      let studentData: Record<string, unknown> | null = null;
      if (app.student_id) {
        const { data: student } = await supabaseAdmin
          .from('students')
          .select('id, user_id, first_name, last_name, nationality, gender, passport_number, date_of_birth, current_address, wechat_id, highest_education, institution_name')
          .eq('id', app.student_id)
          .single();

        if (student) {
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email, phone, country, city, referred_by_partner_id')
            .eq('id', student.user_id)
            .single();

          studentData = {
            id: student.id,
            user_id: student.user_id,
            full_name: user?.full_name || null,
            email: user?.email || null,
            phone: user?.phone || null,
            country: user?.country || null,
            city: user?.city || null,
            nationality: student.nationality || null,
            gender: student.gender || null,
            passport_number: student.passport_number || null,
            date_of_birth: student.date_of_birth || null,
            current_address: student.current_address || null,
            wechat_id: student.wechat_id || null,
            highest_education: student.highest_education || null,
            institution_name: student.institution_name || null,
            source: 'individual' as const,
          };
        }
      }

      let programData: Record<string, unknown> | null = null;
      if (app.program_id) {
        const { data: program } = await supabaseAdmin
          .from('programs')
          .select('id, name, name_fr, degree_level, degree_type, intake_months, tuition_fee_per_year, currency, duration_years, university_id')
          .eq('id', app.program_id)
          .single();

        if (program) {
          let universityData: Record<string, unknown> | null = null;
          if (program.university_id) {
            const { data: university } = await supabaseAdmin
              .from('universities')
              .select('id, name_en, name_cn, city, province, logo_url')
              .eq('id', program.university_id)
              .single();

            if (university) {
              universityData = {
                id: university.id,
                name_en: university.name_en,
                name_cn: university.name_cn,
                city: university.city,
                province: university.province,
                logo_url: university.logo_url,
              };
            }
          }

          programData = {
            id: program.id,
            name: program.name,
            name_fr: program.name_fr,
            degree_level: program.degree_level,
            degree_type: program.degree_type,
            intake_months: program.intake_months,
            tuition_fee_per_year: program.tuition_fee_per_year,
            currency: program.currency,
            duration_years: program.duration_years,
            university: universityData,
          };
        }
      }

      return NextResponse.json({
        id: app.id,
        status: app.status,
        priority: app.priority,
        notes: app.notes,
        personal_statement: (snapshot?.personal_statement as string) || null,
        study_plan: (snapshot?.study_plan as string) || null,
        intake: (snapshot?.intake as string) || null,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        partner_id: app.partner_id,
        program: programData,
        student: studentData,
      });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    // Accept both 'university' (from frontend) and 'university_id' for compatibility
    const universityId = searchParams.get('university') || searchParams.get('university_id') || '';
    const degreeLevel = searchParams.get('degree_type') || searchParams.get('degree_level') || '';
    const search = searchParams.get('search') || '';
    // Support filtering by student user_id (for detail page "View All Applications")
    const filterStudentId = searchParams.get('student_id') || '';
    const offset = (page - 1) * limit;

    // First get user IDs of truly individual students (not referred by partner)
    const { data: individualUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .is('referred_by_partner_id', null);

    const individualUserIds = (individualUsers || []).map(u => u.id);

    // If no individual users, return empty result
    if (individualUserIds.length === 0) {
      return NextResponse.json({
        applications: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 },
      });
    }

    // Get student IDs for individual users
    const { data: individualStudentRecords } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .in('user_id', individualUserIds);

    const individualStudentIds = (individualStudentRecords || []).map(s => s.id);

    // If no individual students, return empty result
    if (individualStudentIds.length === 0) {
      return NextResponse.json({
        applications: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 },
      });
    }

    // Build base query for applications
    let baseQuery = supabaseAdmin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('student_id', individualStudentIds)
      .is('partner_id', null);

    if (status) baseQuery = baseQuery.eq('status', status);

    const { count: totalCount } = await baseQuery;

    // Now get applications data
    let dataQuery = supabaseAdmin
      .from('applications')
      .select(`
        id,
        status,
        priority,
        notes,
        submitted_at,
        created_at,
        updated_at,
        partner_id,
        profile_snapshot,
        student_id,
        program_id
      `)
      .in('student_id', individualStudentIds)
      .is('partner_id', null)
      .order('created_at', { ascending: false });

    if (status) dataQuery = dataQuery.eq('status', status);

    const { data: applications, error: fetchError } = await dataQuery;

    if (fetchError) {
      console.error('Error fetching individual applications:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Collect IDs for batch fetching
    const studentIds = [...new Set(applications?.map(a => a.student_id).filter(Boolean) || [])];
    const programIds = [...new Set(applications?.map(a => a.program_id).filter(Boolean) || [])];

    // Batch fetch students
    const { data: studentsData } = studentIds.length > 0
      ? await supabaseAdmin.from('students').select('id, user_id, nationality, gender, highest_education').in('id', studentIds)
      : { data: [] };
    
    const studentUserIds = [...new Set(studentsData?.map(s => s.user_id).filter(Boolean) || [])];
    
    // Batch fetch student users
    const { data: studentUsersData } = studentUserIds.length > 0
      ? await supabaseAdmin.from('users').select('id, full_name, email').in('id', studentUserIds)
      : { data: [] };

    // Batch fetch programs
    const { data: programsData } = programIds.length > 0
      ? await supabaseAdmin.from('programs').select('id, name, degree_level, university_id').in('id', programIds)
      : { data: [] };
    
    const universityIds = [...new Set(programsData?.map(p => p.university_id).filter(Boolean) || [])];
    
    // Batch fetch universities
    const { data: universitiesData } = universityIds.length > 0
      ? await supabaseAdmin.from('universities').select('id, name_en, city, province').in('id', universityIds)
      : { data: [] };

    // Build maps
    const studentMap = new Map(studentsData?.map(s => [s.id, s]) || []);
    const studentUserMap = new Map(studentUsersData?.map(u => [u.id, u]) || []);
    const programMap = new Map(programsData?.map(p => [p.id, p]) || []);
    const universityMap = new Map(universitiesData?.map(u => [u.id, u]) || []);

    // Build user -> student map for filterStudentId
    const userIdToStudentIdMap = new Map();
    for (const sr of (individualStudentRecords || [])) {
      userIdToStudentIdMap.set(sr.user_id, sr.id);
    }

    // Transform data and apply filters in-memory
    let transformedApplications: ApplicationWithPartner[] = (applications || []).map(app => {
      const student = studentMap.get(app.student_id);
      const studentUser = student?.user_id ? studentUserMap.get(student.user_id) : null;
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
        partner_id: app.partner_id,
        created_by: null,
        created_by_partner: null,
        updated_by: null,
        updated_by_partner: null,
        intake: (app.profile_snapshot as { intake?: string } | null)?.intake || null,
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
          id: student?.id || null,
          user_id: student?.user_id || null,
          full_name: studentUser?.full_name || null,
          email: studentUser?.email || null,
          nationality: student?.nationality || null,
          gender: student?.gender || null,
          highest_education: student?.highest_education || null,
          source: 'individual' as const,
        } as any,
      };
    });

    // Apply in-memory filters
    let filteredApplications = transformedApplications;

    if (universityId) {
      filteredApplications = filteredApplications.filter(app => 
        app.program?.university?.id === universityId
      );
    }

    if (degreeLevel) {
      filteredApplications = filteredApplications.filter(app => 
        app.program?.degree_level?.toLowerCase() === degreeLevel.toLowerCase()
      );
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = filteredApplications.filter(app => 
        app.student?.full_name?.toLowerCase().includes(searchLower) ||
        app.program?.name?.toLowerCase().includes(searchLower)
      );
    }

    if (filterStudentId) {
      const targetStudentId = userIdToStudentIdMap.get(filterStudentId);
      if (targetStudentId) {
        filteredApplications = filteredApplications.filter(app => 
          app.student?.id === targetStudentId
        );
      } else {
        filteredApplications = [];
      }
    }

    // Manual pagination
    const paginatedApplications = filteredApplications.slice(offset, offset + limit);

    // Calculate stats
    const stats = {
      total: filteredApplications.length,
      pending: 0,
      underReview: 0,
      accepted: 0,
      rejected: 0,
    };

    for (const a of filteredApplications) {
      if (a.status === 'submitted' || a.status === 'draft') {
        stats.pending++;
      } else if (a.status === 'under_review') {
        stats.underReview++;
      } else if (a.status === 'accepted') {
        stats.accepted++;
      } else if (a.status === 'rejected') {
        stats.rejected++;
      }
    }

    return NextResponse.json({
      applications: paginatedApplications,
      pagination: {
        page,
        limit,
        total: filteredApplications.length,
        totalPages: Math.ceil(filteredApplications.length / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error in individual applications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/individual-applications
 * Admin creates an application for an individual student (no partner).
 */
export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const body = await request.json();
    const supabaseAdmin = getSupabaseClient();

    const {
      student_id,
      program_ids,
      intake_semester,
      intake_year,
      priority,
      notes,
    } = body;

    // Validate required fields
    if (!student_id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    if (!program_ids || !Array.isArray(program_ids) || program_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one program must be selected' },
        { status: 400 }
      );
    }

    // Verify student exists and is an individual student
    const { data: studentRecord, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .single();

    if (studentError || !studentRecord) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Verify the student's user is truly individual (not partner-referred)
    const { data: studentUser } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name, referred_by_partner_id')
      .eq('id', studentRecord.user_id)
      .single();

    if (studentUser?.role !== 'student') {
      return NextResponse.json({ error: 'Selected user is not a student' }, { status: 400 });
    }

    // Verify all programs exist
    const { data: programs, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, name, degree_level, university_id')
      .in('id', program_ids);

    if (programError || !programs || programs.length === 0) {
      return NextResponse.json({ error: 'One or more selected programs not found' }, { status: 404 });
    }

    // Get university info for response
    const universityIds = [...new Set(programs.map(p => p.university_id).filter(Boolean))];
    const { data: universities } = universityIds.length > 0
      ? await supabaseAdmin
          .from('universities')
          .select('id, name_en')
          .in('id', universityIds)
      : { data: [] };
    const universityMap = new Map(universities?.map(u => [u.id, u.name_en]) || []);

    // Create an application record for each selected program
    const createdApplications = [];
    for (const program of programs) {
      const { data: newApp, error: insertError } = await supabaseAdmin
        .from('applications')
        .insert({
          student_id,
          program_id: program.id,
          partner_id: null, // Individual application - no partner
          user_id: studentRecord.user_id,
          status: 'draft',
          priority: priority || 0,
          notes: notes || null,
          intake_semester: intake_semester || null,
          intake_year: intake_year ? parseInt(intake_year) : null,
        })
        .select('id, status, created_at')
        .single();

      if (insertError) {
        console.error(`Error creating application for program ${program.id}:`, insertError);
        continue;
      }

      createdApplications.push({
        ...newApp,
        program_name: program.name,
        degree_level: program.degree_level,
        university_name: program.university_id ? universityMap.get(program.university_id) || 'Unknown' : 'Unknown',
      });
    }

    if (createdApplications.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create any applications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdApplications.length} application(s) for ${studentUser?.full_name || 'student'}`,
      applications: createdApplications,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating individual application:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
