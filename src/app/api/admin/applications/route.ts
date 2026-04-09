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
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Build query with correct relationships
    let query = supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        created_at,
        updated_at,
        intake,
        personal_statement,
        study_plan,
        programs (
          id,
          name_en,
          name_cn,
          degree_type,
          universities (
            id,
            name_en,
            name_cn,
            city,
            province
          )
        ),
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
      query = query.eq('university_id', universityId);
    }

    if (search) {
      // Search in student name or program name
      query = query.or(`students.users.full_name.ilike.%${search}%,programs.name_en.ilike.%${search}%`);
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
      // Handle Supabase returning relations as arrays
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const user = student?.users ? (Array.isArray(student.users) ? student.users[0] : student.users) : null;
      
      return {
        id: app.id,
        status: app.status,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        updated_at: app.updated_at,
        intake: app.intake,
        personal_statement: app.personal_statement,
        study_plan: app.study_plan,
        program: app.programs,
        student: {
          id: student?.id,
          user_id: student?.user_id,
          full_name: user?.full_name,
          email: user?.email,
          nationality: student?.nationality,
          gender: student?.gender,
          highest_education: student?.highest_education,
        },
      };
    });

    return NextResponse.json({
      applications: transformedApplications,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in admin applications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
