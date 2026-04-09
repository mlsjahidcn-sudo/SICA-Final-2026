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
      
      // Applications by degree type
      supabaseAdmin
        .from('applications')
        .select('programs(degree_type)')
        .not('status', 'eq', 'draft'),
      
      // Recent activity for table
      supabaseAdmin
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          updated_at,
          passport_first_name,
          passport_last_name,
          users (full_name, email),
          programs (name, degree_type, universities (name))
        `)
        .order('updated_at', { ascending: false })
        .limit(20),
    ]);

    // Process applications trend
    const trendData: { date: string; applications: number; students: number }[] = [];
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
        students: Math.floor(Math.random() * 5) + 1, // Placeholder for demo
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

    // Process applications by degree
    const degreeCounts: Record<string, number> = {
      bachelor: 0,
      master: 0,
      phd: 0,
      language: 0,
      short_term: 0,
    };
    for (const app of (applicationsByDegree.data || [])) {
      const program = app.programs as { degree_type?: string } | { degree_type?: string }[] | null;
      let degree: string | undefined;
      if (Array.isArray(program)) {
        degree = program[0]?.degree_type;
      } else if (program) {
        degree = program.degree_type;
      }
      if (degree && degree in degreeCounts) {
        degreeCounts[degree]++;
      }
    }

    // Format recent activity for table
    const tableData = (recentActivity.data || []).map((app) => {
      const user = Array.isArray(app.users) ? app.users[0] : app.users;
      const program = app.programs as { name?: string; degree_type?: string; universities?: { name?: string } | { name?: string }[] | null } | null;
      const university = Array.isArray(program?.universities) ? program?.universities[0] : program?.universities;
      
      return {
        id: app.id,
        student: user?.full_name || `${app.passport_first_name} ${app.passport_last_name}`,
        email: user?.email || '-',
        program: program?.name || '-',
        degree: program?.degree_type || '-',
        university: university?.name || '-',
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
