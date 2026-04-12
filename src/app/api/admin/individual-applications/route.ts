import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';
import type { ApplicationWithPartner } from '@/lib/types/admin-modules';

/**
 * GET /api/admin/individual-applications
 * Fetch applications from individual students (partner_id IS NULL)
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
    
    // Query applications from individual students
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
      .in('student_id', individualStudentIds) // Only applications from individual students
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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
      // Note: Supabase doesn't support complex OR queries with nested relations
      // We'll filter in-memory after fetching for now
    }

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching individual applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Transform data
    let transformedApplications: ApplicationWithPartner[] = (applications || []).map(app => {
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

    // Apply search filter in-memory
    if (search) {
      const searchLower = search.toLowerCase();
      transformedApplications = transformedApplications.filter(app => 
        app.student?.full_name?.toLowerCase().includes(searchLower) ||
        app.program?.name?.toLowerCase().includes(searchLower)
      );
    }

    // Get stats - matching frontend expectation
    const stats = {
      total: count || 0,
      pending: 0,
      underReview: 0,
      accepted: 0,
      rejected: 0,
    };

    for (const app of (applications || [])) {
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
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats,
    });
  } catch (error) {
    console.error('Error in individual applications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
