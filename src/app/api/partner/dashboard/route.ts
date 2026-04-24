import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePartner } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await requirePartner(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();

    // Get time range from query params (default 30 days)
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const lastPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Determine access scope: admin sees all team members' students, member sees only their own
    const isAdmin = !user.partner_role || user.partner_role === 'partner_admin';

    // Get the list of referrer IDs this partner user can see
    let referrerIds: string[];
    if (isAdmin) {
      // Admin sees applications from students referred by themselves + all team members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${user.id},partner_id.eq.${user.id}`)
        .eq('role', 'partner');

      referrerIds = (teamMembers || []).map(m => m.id);
      if (!referrerIds.includes(user.id)) referrerIds.push(user.id);
    } else {
      // Member sees only students they referred
      referrerIds = [user.id];
    }

    // Find students referred by these partner users
    const { data: referredStudents } = await supabase
      .from('users')
      .select('id')
      .in('referred_by_partner_id', referrerIds)
      .eq('role', 'student');

    const referredUserIds = (referredStudents || []).map(s => s.id);

    // Get student record IDs for these users
    let studentIds: string[] = [];
    if (referredUserIds.length > 0) {
      const { data: studentRecs } = await supabase
        .from('students')
        .select('id')
        .in('user_id', referredUserIds);
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

    const { data: applications, error: appsError } = await appsQuery;
    
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

    // Step 2: Fetch related data in batches
    const recentStudentIds = (recentApplications || []).map(a => a.student_id).filter((id): id is string => !!id);
    const recentProgramIds = (recentApplications || []).map(a => a.program_id).filter((id): id is string => !!id);

    // Fetch students
    let studentsData: Record<string, { first_name: string; last_name: string; nationality: string; user_id: string }> = {};
    if (recentStudentIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, nationality, user_id')
        .in('id', recentStudentIds);
      (students || []).forEach(s => { studentsData[s.id] = s; });
    }

    // Fetch student users (emails)
    const studentUserIds = Object.values(studentsData).map(s => s.user_id).filter((id): id is string => !!id);
    let usersData: Record<string, { email: string }> = {};
    if (studentUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email')
        .in('id', studentUserIds);
      (users || []).forEach(u => { usersData[u.id] = u; });
    }

    // Fetch programs
    let programsData: Record<string, { name: string; degree_level: string; university_id: string }> = {};
    if (recentProgramIds.length > 0) {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, name, degree_level, university_id')
        .in('id', recentProgramIds);
      (programs || []).forEach(p => { programsData[p.id] = p; });
    }

    // Fetch universities
    const universityIds = Object.values(programsData).map(p => p.university_id).filter((id): id is string => !!id);
    let universitiesData: Record<string, { name: string; name_en: string; city: string }> = {};
    if (universityIds.length > 0) {
      const { data: universities } = await supabase
        .from('universities')
        .select('id, name, name_en, city')
        .in('id', universityIds);
      (universities || []).forEach(u => { universitiesData[u.id] = u; });
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
    
    return NextResponse.json({
      stats,
      recentApplications: normalizedRecent,
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
