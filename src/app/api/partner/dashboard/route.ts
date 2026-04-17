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
    
    // Get recent applications with program and university details
    const recentQuery = supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        created_at,
        students (
          first_name,
          last_name,
          nationality,
          user_id,
          users (
            email
          )
        ),
        programs (
          name,
          degree_level,
          universities (
            name,
            name_en,
            city
          )
        )
      `)
      .not('status', 'eq', 'draft')
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: recentApplications, error: recentError } = await recentQuery;
    
    if (recentError) {
      console.error('Error fetching recent applications:', recentError);
    }

    // Normalize recent applications (handle arrays from Supabase relations)
    const normalizedRecent = recentApplications?.map(app => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
      const studentUser = student?.users ? (Array.isArray(student.users) ? student.users[0] : student.users) : null;
      const program = Array.isArray(app.programs) ? app.programs[0] : app.programs;
      const university = program?.universities 
        ? (Array.isArray(program.universities) ? program.universities[0] : program.universities)
        : null;

      return {
        id: app.id,
        status: app.status,
        submitted_at: app.submitted_at,
        created_at: app.created_at,
        first_name: student?.first_name,
        last_name: student?.last_name,
        passport_first_name: student?.first_name, // backward compatibility
        passport_last_name: student?.last_name, // backward compatibility
        nationality: student?.nationality,
        email: studentUser?.email,
        programs: program ? {
          name_en: program.name,
          name: program.name,
          degree_type: program.degree_level, // backward compatibility
          degree_level: program.degree_level,
          universities: university ? {
            name_en: university.name_en || university.name,
            name: university.name,
            city: university.city
          } : null
        } : null
      };
    }) || [];
    
    return NextResponse.json({
      stats,
      recentApplications: normalizedRecent,
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
