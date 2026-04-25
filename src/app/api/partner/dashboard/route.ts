import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';
import { apiCache, CACHE_TTL, withTimeout } from '@/lib/api-cache';

const QUERY_TIMEOUT = 30000; // 30 seconds

export async function GET(request: NextRequest) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    // Get time range from query params (default 30 days)
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    
    // Check cache first (2 minute TTL for partner dashboard)
    const cacheKey = `partner:dashboard:${user.id}:${days}`;
    const cached = apiCache.get(cacheKey) as Record<string, unknown> | null;
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = getSupabaseClient();
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const lastPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Determine access scope: admin sees all team members' students, member sees only their own
    const isAdmin = !user.partner_role || user.partner_role === 'partner_admin';

    // Get the list of referrer IDs this partner user can see
    let referrerIds: string[];
    if (isAdmin) {
      // Admin sees applications from students referred by themselves + all team members
      const teamMembersResult = await withTimeout(
        supabase
          .from('users')
          .select('id')
          .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
          .eq('role', 'partner'),
        QUERY_TIMEOUT,
        'Team members query timed out'
      );
      const { data: teamMembers } = teamMembersResult;

      referrerIds = (teamMembers || []).map(m => m.id);
      if (!referrerIds.includes(user.id)) referrerIds.push(user.id);
    } else {
      // Member sees only students they referred
      referrerIds = [user.id];
    }

    // Find students referred by these partner users
    const referredStudentsResult = await withTimeout(
      supabase
        .from('users')
        .select('id')
        .in('referred_by_partner_id', referrerIds)
        .eq('role', 'student'),
      QUERY_TIMEOUT,
      'Referred students query timed out'
    );
    const { data: referredStudents } = referredStudentsResult;

    const referredUserIds = (referredStudents || []).map(s => s.id);

    // Get student record IDs for these users
    let studentIds: string[] = [];
    if (referredUserIds.length > 0) {
      const studentRecsResult = await withTimeout(
        supabase
          .from('students')
          .select('id')
          .in('user_id', referredUserIds),
        QUERY_TIMEOUT,
        'Student records query timed out'
      );
      const { data: studentRecs } = studentRecsResult;
      studentIds = (studentRecs || []).map(s => s.id);
    }

    // Get total count and status breakdown
    let appsQuery = supabase
      .from('applications')
      .select('status, created_at, submitted_at')
      .not('status', 'eq', 'draft');

    // Filter by student IDs (team referral access)
    if (studentIds.length > 0) {
      appsQuery = appsQuery.in('student_id', studentIds);
    } else {
      // No students found - return empty stats
      return NextResponse.json({
        stats: {
          totalApplications: 0,
          pending: 0,
          underReview: 0,
          accepted: 0,
          rejected: 0,
          thisMonth: 0,
          lastMonth: 0,
        },
        recentApplications: [],
      });
    }

    const appsResult = await withTimeout(
      appsQuery,
      QUERY_TIMEOUT,
      'Applications query timed out'
    );
    const { data: applications, error: appsError } = appsResult;
    
    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }
    
    // Calculate statistics
    const stats = {
      totalApplications: applications?.length || 0,
      pending: applications?.filter(a => a.status === 'submitted').length || 0,
      underReview: applications?.filter(a => a.status === 'under_review').length || 0,
      accepted: applications?.filter(a => a.status === 'accepted').length || 0,
      rejected: applications?.filter(a => a.status === 'rejected').length || 0,
      thisMonth: applications?.filter(a => {
        const created = new Date(a.created_at);
        return created >= startDate && created < now;
      }).length || 0,
      lastMonth: applications?.filter(a => {
        const created = new Date(a.created_at);
        return created >= lastPeriodStart && created < startDate;
      }).length || 0,
    };
    
    // Step 1: Get recent applications (basic fields only)
    const { data: recentApplications, error: recentError } = await supabase
      .from('applications')
      .select('id, status, submitted_at, created_at, student_id, program_id')
      .not('status', 'eq', 'draft')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('Error fetching recent applications:', recentError);
    }

    // Step 2: Collect all IDs for batch enrichment
    const recentStudentIds = (recentApplications || []).map(a => a.student_id).filter((id): id is string => !!id);
    const recentProgramIds = (recentApplications || []).map(a => a.program_id).filter((id): id is string => !!id);

    // Step 3: Fetch students in parallel with applications re-fetch if needed
    const studentsData: Record<string, { first_name: string; last_name: string; nationality: string; user_id: string }> = {};
    const usersData: Record<string, { email: string }> = {};
    const programsData: Record<string, { name: string; degree_level: string; university_id: string }> = {};
    const universitiesData: Record<string, { name: string; name_en: string; city: string }> = {};

    if (recentStudentIds.length > 0 || recentProgramIds.length > 0) {
      // Build parallel queries based on what IDs we have
      const queries: Promise<any>[] = [];
      
      // Fetch students if we have student IDs
      if (recentStudentIds.length > 0) {
        queries.push(
          Promise.resolve(supabase.from('students').select('id, first_name, last_name, nationality, user_id').in('id', recentStudentIds))
            .then(result => ({ type: 'students', data: result.data }))
        );
      }
      
      // Fetch programs if we have program IDs
      if (recentProgramIds.length > 0) {
        queries.push(
          Promise.resolve(supabase.from('programs').select('id, name, degree_level, university_id').in('id', recentProgramIds))
            .then(result => ({ type: 'programs', data: result.data }))
        );
      }

      // Execute student and program queries in parallel
      const results = await Promise.allSettled(queries);
      
      // Process results
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { type, data } = result.value;
          if (type === 'students' && data) {
            (data as any[]).forEach(s => { studentsData[s.id] = s; });
          } else if (type === 'programs' && data) {
            (data as any[]).forEach(p => { programsData[p.id] = p; });
          }
        }
      }

      // Now fetch users and universities in parallel (depend on previous data)
      const secondBatchQueries: Promise<any>[] = [];
      
      const studentUserIds = Object.values(studentsData).map(s => s.user_id).filter((id): id is string => !!id);
      if (studentUserIds.length > 0) {
        secondBatchQueries.push(
          Promise.resolve(supabase.from('users').select('id, email').in('id', studentUserIds))
            .then(result => ({ type: 'users', data: result.data }))
        );
      }
      
      const universityIds = Object.values(programsData).map(p => p.university_id).filter((id): id is string => !!id);
      if (universityIds.length > 0) {
        secondBatchQueries.push(
          Promise.resolve(supabase.from('universities').select('id, name, name_en, city').in('id', universityIds))
            .then(result => ({ type: 'universities', data: result.data }))
        );
      }

      // Execute second batch in parallel
      if (secondBatchQueries.length > 0) {
        const secondResults = await Promise.allSettled(secondBatchQueries);
        
        for (const result of secondResults) {
          if (result.status === 'fulfilled') {
            const { type, data } = result.value;
            if (type === 'users' && data) {
              (data as any[]).forEach(u => { usersData[u.id] = u; });
            } else if (type === 'universities' && data) {
              (data as any[]).forEach(u => { universitiesData[u.id] = u; });
            }
          }
        }
      }
    }

    // Normalize recent applications
    const normalizedRecent = (recentApplications || []).map(app => {
      const student = app.student_id ? studentsData[app.student_id] : null;
      const studentUser = student?.user_id ? usersData[student.user_id] : null;
      const program = app.program_id ? programsData[app.program_id] : null;
      const university = program?.university_id ? universitiesData[program.university_id] : null;

      return {
        id: app.id,
        status: app.status,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        first_name: student?.first_name,
        last_name: student?.last_name,
        passport_first_name: student?.first_name,
        passport_last_name: student?.last_name,
        nationality: student?.nationality,
        email: studentUser?.email,
        programs: program ? {
          name_en: program.name,
          name: program.name,
          degree_type: program.degree_level,
          degree_level: program.degree_level,
          universities: university ? {
            name_en: university.name_en || university.name,
            name: university.name,
            city: university.city
          } : null
        } : null
      };
    });
    
    const responseData = {
      stats,
      recentApplications: normalizedRecent,
    };

    // Cache the response for 2 minutes
    apiCache.set(cacheKey, responseData, CACHE_TTL.MEDIUM);
    
    return NextResponse.json(responseData);
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
