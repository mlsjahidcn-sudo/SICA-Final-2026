import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

    // Fetch all statistics in parallel
    const [
      studentsCount,
      pendingApplications,
      universitiesCount,
      acceptedApplications,
      totalApplications,
      applicationsTrend,
      studentsByCountry,
      applicationsByDegree,
      recentActivity,
    ] = await Promise.all([
      // Total students
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student'),
      
      // Pending applications
      supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review', 'document_request']),
      
      // Total universities
      supabaseAdmin
        .from('universities')
        .select('id', { count: 'exact', head: true }),
      
      // Accepted applications for acceptance rate
      supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'accepted'),
      
      // Total applications for acceptance rate
      supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact', head: true })
        .not('status', 'eq', 'draft'),
      
      // Applications trend (last 30 days)
      supabaseAdmin
        .from('applications')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Students by country
      supabaseAdmin
        .from('students')
        .select('nationality'),
      
      // Applications by degree level (actual column: programs.degree_level)
      supabaseAdmin
        .from('applications')
        .select('programs(degree_level)')
        .not('status', 'eq', 'draft'),
      
      // Recent activity for table - use correct column names
      // applications has: student_id (-> students.id), program_id (-> programs.id)
      // programs has: name (not name_en), degree_level (not degree_type)
      // universities has: name_en (not name)
      supabaseAdmin
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          students (
            id,
            user_id,
            first_name,
            last_name,
            nationality,
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
              name_en
            )
          )
        `)
        .order('updated_at', { ascending: false })
        .limit(20),
    ]);

    // Process applications trend
    const trendData: { date: string; applications: number }[] = [];
    const trendMap = new Map<string, number>();
    
    for (const app of (applicationsTrend.data || [])) {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    }
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      trendData.push({
        date,
        applications: trendMap.get(date) || 0,
      });
    }

    // Process students by country (using nationality)
    const countryCounts: Record<string, number> = {};
    for (const student of (studentsByCountry.data || [])) {
      if (student.nationality) {
        countryCounts[student.nationality] = (countryCounts[student.nationality] || 0) + 1;
      }
    }
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));

    // Process applications by degree level
    const degreeCounts: Record<string, number> = {};
    for (const app of (applicationsByDegree.data || [])) {
      const program = app.programs as { degree_level?: string } | { degree_level?: string }[] | null;
      let degree: string | undefined;
      if (Array.isArray(program)) {
        degree = program[0]?.degree_level;
      } else if (program) {
        degree = program.degree_level;
      }
      if (degree) {
        degreeCounts[degree] = (degreeCounts[degree] || 0) + 1;
      }
    }

    // Format recent activity for table
    const tableData = (recentActivity.data || []).map((app) => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const studentUser = student?.users
        ? (Array.isArray(student.users) ? student.users[0] : student.users)
        : null;
      const program = app.programs as { name?: string; degree_level?: string; universities?: { name_en?: string } | { name_en?: string }[] | null } | null;
      const university = Array.isArray(program?.universities) ? program?.universities[0] : program?.universities;
      
      // Student name: prefer users.full_name, fallback to first_name + last_name
      const studentName = studentUser?.full_name 
        || (student?.first_name || student?.last_name ? [student?.first_name, student?.last_name].filter(Boolean).join(' ') : null)
        || '-';
      
      return {
        id: app.id,
        student: studentName,
        email: studentUser?.email || '-',
        program: program?.name || '-',
        degree: program?.degree_level || '-',
        university: university?.name_en || '-',
        status: app.status,
        date: app.updated_at || app.created_at,
      };
    });

    // Calculate acceptance rate
    const acceptanceRate = totalApplications.count && totalApplications.count > 0
      ? Math.round((acceptedApplications.count || 0) / totalApplications.count * 100)
      : 0;

    return NextResponse.json({
      stats: {
        totalStudents: studentsCount.count || 0,
        pendingApplications: pendingApplications.count || 0,
        partnerUniversities: universitiesCount.count || 0,
        acceptanceRate,
      },
      chartData: trendData,
      topCountries,
      applicationsByDegree: degreeCounts,
      tableData,
    });
  } catch (error) {
    console.error('Error fetching dashboard v2 data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
