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

    // Support ?id= for single record lookup (detail page)
    const idParam = searchParams.get('id');
    if (idParam) {
      const { data: app, error } = await supabaseAdmin
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
          students (
            id,
            user_id,
            first_name,
            last_name,
            nationality,
            gender,
            passport_number,
            date_of_birth,
            current_address,
            wechat_id,
            highest_education,
            institution_name,
            users (
              id,
              full_name,
              email,
              phone,
              country,
              city,
              referred_by_partner_id
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
        `)
        .eq('id', idParam)
        .single();

      if (error || !app) {
        return NextResponse.json({ error: 'Application not found' }, { status: 404 });
      }

      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const studentUser = student?.users
        ? (Array.isArray(student.users) ? student.users[0] : student.users)
        : null;
      const program = Array.isArray(app.programs) ? app.programs[0] : app.programs;
      const university = program?.universities
        ? (Array.isArray(program.universities) ? program.universities[0] : program.universities)
        : null;

      return NextResponse.json({
        id: app.id,
        status: app.status,
        priority: app.priority,
        notes: app.notes,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        partner_id: app.partner_id,
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
          phone: studentUser?.phone,
          country: studentUser?.country,
          city: studentUser?.city,
          nationality: student?.nationality,
          gender: student?.gender,
          passport_number: student?.passport_number,
          date_of_birth: student?.date_of_birth,
          current_address: student?.current_address,
          wechat_id: student?.wechat_id,
          highest_education: student?.highest_education,
          institution_name: student?.institution_name,
          source: 'individual' as const,
        },
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

    // First get user IDs of individual students (not referred by partner)
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
      .select('id')
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

    // Build base query - filters BEFORE pagination (.range())
    let query = supabaseAdmin
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
        students (
          id,
          user_id,
          nationality,
          gender,
          highest_education,
          users (
            id,
            full_name,
            email,
            referred_by_partner_id
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
      `, { count: 'exact' })
      .in('student_id', individualStudentIds)
      .order('created_at', { ascending: false });

    // Apply ALL filters BEFORE .range() for accurate results
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
      // Apply search at database level using OR across student name and program name
      query = query.or(`students.users.full_name.ilike.%${search}%,programs.name.ilike.%${search}%`);
    }

    if (filterStudentId) {
      query = query.eq('students.user_id', filterStudentId);
    }

    // Apply pagination LAST (after all filters)
    query = query.range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching individual applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Transform data
    const transformedApplications: ApplicationWithPartner[] = (applications || []).map(app => {
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
          id: student?.id,
          user_id: student?.user_id,
          full_name: studentUser?.full_name,
          email: studentUser?.email,
          nationality: student?.nationality,
          gender: student?.gender,
          highest_education: student?.highest_education,
          source: 'individual' as const,
        },
      };
    });

    // Calculate stats based on current filter criteria
    let statsQuery = supabaseAdmin
      .from('applications')
      .select('status', { count: 'exact', head: true })
      .in('student_id', individualStudentIds);

    // Re-apply filters for accurate stats
    if (status) {
      statsQuery = statsQuery.eq('status', status);
    }
    if (universityId) {
      statsQuery = statsQuery.eq('programs.university_id', universityId); // Note: may need separate approach
    }

    // For stats, do a fresh count with same base criteria
    const { count: totalCount } = await supabaseAdmin
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .in('student_id', individualStudentIds);

    // Get detailed status counts
    const { data: allAppsForStats } = await supabaseAdmin
      .from('applications')
      .select('status')
      .in('student_id', individualStudentIds);

    const stats = {
      total: totalCount || 0,
      pending: 0,
      underReview: 0,
      accepted: 0,
      rejected: 0,
    };

    for (const a of (allAppsForStats || [])) {
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
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total: count ?? transformedApplications.length,
        totalPages: Math.ceil((count ?? transformedApplications.length) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error in individual applications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
