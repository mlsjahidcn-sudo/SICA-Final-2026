import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { ApplicationWithPartner } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/partner-applications
 * Fetch applications from partner-referred students (partner_id IS NOT NULL)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const universityId = searchParams.get('university_id') || '';
    const degreeLevel = searchParams.get('degree_type') || searchParams.get('degree_level') || '';
    const search = searchParams.get('search') || '';
    const partner_id = searchParams.get('partner_id') || ''; // Filter by specific partner
    const id = searchParams.get('id') || ''; // Single application lookup
    const filterStudentId = searchParams.get('student_id') || '';
    const offset = (page - 1) * limit;

    // Single record lookup mode (for detail pages)
    if (id) {
      const { data: singleApp, error: singleError } = await supabaseAdmin
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
          created_by,
          updated_by,
          profile_snapshot,
          student_id,
          program_id
        `)
        .eq('id', id)
        .single();

      if (singleError || !singleApp) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      // Step-by-step fetching to avoid nested query issues
      let student = null;
      let studentUser = null;
      if (singleApp.student_id) {
        const { data: studentData } = await supabaseAdmin
          .from('students')
          .select('id, user_id, nationality, gender, highest_education')
          .eq('id', singleApp.student_id)
          .single();
        student = studentData;
        
        if (student?.user_id) {
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('id, full_name, email, referred_by_partner_id')
            .eq('id', student.user_id)
            .single();
          studentUser = userData;
        }
      }

      let program = null;
      let university = null;
      if (singleApp.program_id) {
        const { data: programData } = await supabaseAdmin
          .from('programs')
          .select('id, name, degree_level, university_id')
          .eq('id', singleApp.program_id)
          .single();
        program = programData;
        
        if (program?.university_id) {
          const { data: universityData } = await supabaseAdmin
            .from('universities')
            .select('id, name_en, city, province')
            .eq('id', program.university_id)
            .single();
          university = universityData;
        }
      }

      // Get partner info for referred_by_partner, created_by, updated_by, and partner_id
      const allPartnerIds: string[] = [
        studentUser?.referred_by_partner_id,
        (singleApp as Record<string, unknown>).created_by as string,
        (singleApp as Record<string, unknown>).updated_by as string,
        (singleApp as Record<string, unknown>).partner_id as string,
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

      const createdBy = (singleApp as Record<string, unknown>).created_by as string | null;
      const updatedBy = (singleApp as Record<string, unknown>).updated_by as string | null;
      const referredByPartner = studentUser?.referred_by_partner_id
        ? partnerInfoMap.get(studentUser.referred_by_partner_id) || null
        : null;

      return NextResponse.json({
        application: {
          id: singleApp.id,
          status: singleApp.status,
          priority: singleApp.priority,
          notes: singleApp.notes,
          submitted_at: singleApp.submitted_at,
          created_at: singleApp.created_at,
          updated_at: singleApp.updated_at,
          partner_id: singleApp.partner_id,
          created_by: createdBy,
          created_by_partner: createdBy ? partnerInfoMap.get(createdBy) || null : (singleApp.partner_id ? partnerInfoMap.get(singleApp.partner_id) || null : null),
          updated_by: updatedBy,
          updated_by_partner: updatedBy ? partnerInfoMap.get(updatedBy) || null : null,
          intake: (singleApp.profile_snapshot as { intake?: string } | null)?.intake || null,
          program: program ? {
            id: program.id,
            name: program.name,
            degree_level: program.degree_level,
            university: university ? { id: university.id, name_en: university.name_en, city: university.city, province: university.province } : null,
          } : null,
          student: student ? {
            id: student.id,
            user_id: student.user_id,
            full_name: studentUser?.full_name || null,
            email: studentUser?.email || null,
            nationality: student.nationality,
            gender: student.gender,
            highest_education: student.highest_education,
            source: 'partner_referred' as const,
            referred_by_partner: referredByPartner,
          } : null as any,
        },
      });
    }

    // First get user IDs of partner-referred students
    const { data: partnerUsers } = await supabaseAdmin
      .from('users')
      .select('id')
      .not('referred_by_partner_id', 'is', null);
    
    const partnerUserIds = (partnerUsers || []).map(u => u.id);
    
    // If no partner users, return empty result
    if (partnerUserIds.length === 0) {
      return NextResponse.json({
        applications: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 },
      });
    }
    
    // Get student IDs for partner-referred users
    const { data: partnerStudentRecords } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .in('user_id', partnerUserIds);
    
    const partnerStudentIds = (partnerStudentRecords || []).map(s => s.id);
    
    // If no partner students, return empty result
    if (partnerStudentIds.length === 0) {
      return NextResponse.json({
        applications: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
        stats: { total: 0, pending: 0, underReview: 0, accepted: 0, rejected: 0 },
      });
    }
    
    // Build base query without range first for counting
    let baseQuery = supabaseAdmin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('student_id', partnerStudentIds);

    if (status) baseQuery = baseQuery.eq('status', status);
    if (partner_id) baseQuery = baseQuery.eq('partner_id', partner_id);
    if (filterStudentId) {
      // Find student record ID from user ID
      const studentRec = partnerStudentRecords?.find(s => s.user_id === filterStudentId);
      if (studentRec) {
        baseQuery = baseQuery.eq('student_id', studentRec.id);
      }
    }

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
        created_by,
        updated_by,
        profile_snapshot,
        student_id,
        program_id
      `)
      .in('student_id', partnerStudentIds)
      .order('created_at', { ascending: false });

    if (status) dataQuery = dataQuery.eq('status', status);
    if (partner_id) dataQuery = dataQuery.eq('partner_id', partner_id);
    if (filterStudentId) {
      const studentRec = partnerStudentRecords?.find(s => s.user_id === filterStudentId);
      if (studentRec) {
        dataQuery = dataQuery.eq('student_id', studentRec.id);
      }
    }

    const { data: applications, error: fetchError } = await dataQuery;

    if (fetchError) {
      console.error('Error fetching partner applications:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Collect all IDs for batch fetching
    const studentIds = [...new Set(applications?.map(a => a.student_id).filter(Boolean) || [])];
    const programIds = [...new Set(applications?.map(a => a.program_id).filter(Boolean) || [])];

    // Batch fetch students
    const { data: studentsData } = studentIds.length > 0
      ? await supabaseAdmin.from('students').select('id, user_id, nationality, gender, highest_education').in('id', studentIds)
      : { data: [] };
    
    const studentUserIds = [...new Set(studentsData?.map(s => s.user_id).filter(Boolean) || [])];
    
    // Batch fetch student users
    const { data: studentUsersData } = studentUserIds.length > 0
      ? await supabaseAdmin.from('users').select('id, full_name, email, referred_by_partner_id').in('id', studentUserIds)
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

    // Build maps for quick lookup
    const studentMap = new Map(studentsData?.map(s => [s.id, s]) || []);
    const studentUserMap = new Map(studentUsersData?.map(u => [u.id, u]) || []);
    const programMap = new Map(programsData?.map(p => [p.id, p]) || []);
    const universityMap = new Map(universitiesData?.map(u => [u.id, u]) || []);

    // Get partner info for referred students, created_by, updated_by, and partner_id
    const allPartnerIds = [...new Set([
      ...(studentUsersData?.map(u => u.referred_by_partner_id).filter(Boolean) || []),
      ...(applications?.map(a => (a as Record<string, unknown>).created_by).filter(Boolean) || []),
      ...(applications?.map(a => (a as Record<string, unknown>).updated_by).filter(Boolean) || []),
      ...(applications?.map(a => (a as Record<string, unknown>).partner_id).filter(Boolean) || []),
    ])] as string[];

    const partnerMap = new Map<string, { id: string; full_name: string; email: string; company_name?: string }>();

    if (allPartnerIds.length > 0) {
      const { data: partnerUserDetails } = await supabaseAdmin
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

      for (const pu of (partnerUserDetails || [])) {
        partnerMap.set(pu.id, {
          id: pu.id,
          full_name: pu.full_name,
          email: pu.email,
          company_name: partnerCompanyMap.get(pu.id),
        });
      }
    }

    // Transform data
    let transformedApplications: ApplicationWithPartner[] = (applications || []).map(app => {
      const student = studentMap.get(app.student_id);
      const studentUser = student?.user_id ? studentUserMap.get(student.user_id) : null;
      const program = programMap.get(app.program_id);
      const university = program?.university_id ? universityMap.get(program.university_id) : null;

      const createdBy = (app as Record<string, unknown>).created_by as string | null;
      const updatedBy = (app as Record<string, unknown>).updated_by as string | null;
      const referredByPartner = studentUser?.referred_by_partner_id
        ? partnerMap.get(studentUser.referred_by_partner_id) || null
        : null;

      return {
        id: app.id,
        status: app.status,
        priority: app.priority,
        notes: app.notes,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        partner_id: app.partner_id,
        intake: (app.profile_snapshot as { intake?: string } | null)?.intake || null,
        created_by: createdBy,
        created_by_partner: createdBy ? partnerMap.get(createdBy) || null : (app.partner_id ? partnerMap.get(app.partner_id) || null : null),
        updated_by: updatedBy,
        updated_by_partner: updatedBy ? partnerMap.get(updatedBy) || null : null,
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
        student: student ? {
          id: student.id,
          user_id: student.user_id,
          full_name: studentUser?.full_name || null,
          email: studentUser?.email || null,
          nationality: student.nationality,
          gender: student.gender,
          highest_education: student.highest_education,
          source: 'partner_referred' as const,
          referred_by_partner: referredByPartner,
        } : null as any,
      };
    });

    // Apply search filter in-memory
    let filteredApplications = transformedApplications;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredApplications = transformedApplications.filter(app => 
        app.student?.full_name?.toLowerCase().includes(searchLower) ||
        app.program?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Apply university filter in-memory
    if (universityId) {
      filteredApplications = filteredApplications.filter(app => 
        app.program?.university?.id === universityId
      );
    }

    // Apply degree level filter in-memory
    if (degreeLevel) {
      filteredApplications = filteredApplications.filter(app => 
        app.program?.degree_level?.toLowerCase() === degreeLevel.toLowerCase()
      );
    }

    // Manual pagination after all filters
    const paginatedApplications = filteredApplications.slice(offset, offset + limit);

    // Get stats based on filtered data
    const stats = {
      total: filteredApplications.length,
      pending: 0,
      underReview: 0,
      accepted: 0,
      rejected: 0,
    };

    for (const app of filteredApplications) {
      if (app.status === 'submitted' || app.status === 'draft') {
        stats.pending++;
      } else if (app.status === 'under_review') {
        stats.underReview++;
      } else if (app.status === 'accepted') {
        stats.accepted++;
      } else if (app.status === 'rejected') {
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
    console.error('Error in partner applications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/partner-applications
 * Admin creates an application on behalf of a partner/student.
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
      partner_id,
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

    // Verify student exists and is a partner-referred student
    // student_id from frontend is the users.id (user_id), not students.id
    const { data: studentRecord, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('user_id', student_id)
      .single();

    if (studentError || !studentRecord) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch user info separately to avoid nested query issues
    const { data: studentUser, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, role, full_name, referred_by_partner_id')
      .eq('id', studentRecord.user_id)
      .single();

    if (userError || !studentUser) {
      return NextResponse.json({ error: 'Student user not found' }, { status: 404 });
    }

    if (studentUser.role !== 'student') {
      return NextResponse.json({ error: 'Selected user is not a student' }, { status: 400 });
    }

    // Determine partner_id from student's referral if not explicitly provided
    const resolvedPartnerId = partner_id || studentUser.referred_by_partner_id;

    if (!resolvedPartnerId) {
      return NextResponse.json(
        { error: 'This student is not assigned to any partner. Please specify a partner_id.' },
        { status: 400 }
      );
    }

    // Verify all programs exist
    const { data: programs, error: programError } = await supabaseAdmin
      .from('programs')
      .select('id, name, degree_level, university_id, universities(id, name_en)')
      .in('id', program_ids);

    if (programError || !programs || programs.length === 0) {
      return NextResponse.json({ error: 'One or more selected programs not found' }, { status: 404 });
    }

    // Create an application record for each selected program
    // Use students.id (studentRecord.id) for student_id field, not users.id
    const createdApplications = [];
    for (const program of programs) {
      const { data: newApp, error: insertError } = await supabaseAdmin
        .from('applications')
        .insert({
          student_id: studentRecord.id,
          program_id: program.id,
          partner_id: resolvedPartnerId,
          user_id: studentUser.id,
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
        university_name: (program.universities as unknown as { name_en?: string } | null)?.name_en || 'Unknown',
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
      message: `Created ${createdApplications.length} application(s) for ${studentUser.full_name}`,
      applications: createdApplications,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating admin application:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
