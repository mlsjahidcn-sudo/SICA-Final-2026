import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/admin/applications - List all applications (admin/partner)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || !['admin', 'partner'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || '';
    const universityId = searchParams.get('university_id') || '';
    const degreeLevel = searchParams.get('degree_type') || searchParams.get('degree_level') || '';
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Build query with correct schema columns
    // applications: student_id (-> students), program_id (-> programs)
    // programs: name, degree_level (NOT name_en, degree_type)
    // universities: name_en (NOT name)
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        priority,
        notes,
        submitted_at,
        created_at,
        updated_at,
        students (
          id,
          user_id,
          nationality,
          gender,
          highest_education,
          users (
            id,
            full_name,
            email
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
      `, { count: 'exact' });

    // Partners can only see applications of students they referred
    if (user.role === 'partner') {
      query = query.eq('partner_id', user.id);
    }

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
      // Search in student user name or program name
      query = query.or(`students.users.full_name.ilike.%${search}%,programs.name.ilike.%${search}%`);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Transform data to flatten structure for frontend
    const transformedApplications = (applications || []).map(app => {
      // Handle Supabase returning relations as arrays or single objects
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
        },
      };
    });

    // Compute stats from the current result set
    const stats = {
      total: count || 0,
      submitted: 0,
      under_review: 0,
      document_request: 0,
      interview_scheduled: 0,
      accepted: 0,
      rejected: 0,
    };
    // Count statuses from the current page (approximate)
    for (const app of applications || []) {
      const s = app.status as string;
      if (s in stats) {
        (stats as Record<string, number>)[s]++;
      }
    }

    // Get total counts across all applications (not just current page)
    const { data: allStatuses } = await supabase
      .from('applications')
      .select('status');
    
    if (allStatuses) {
      const fullStats = {
        total: allStatuses.length,
        submitted: 0,
        under_review: 0,
        document_request: 0,
        interview_scheduled: 0,
        accepted: 0,
        rejected: 0,
      };
      for (const row of allStatuses) {
        const s = row.status as string;
        if (s in fullStats) {
          (fullStats as Record<string, number>)[s]++;
        }
      }
      Object.assign(stats, fullStats);
    }

    return NextResponse.json({
      applications: transformedApplications,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats,
    });
  } catch (error) {
    console.error('Error in admin applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
