import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Use centralized auth helper
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabaseAdmin = getSupabaseClient();

    // Fetch all statistics in parallel
    const [
      studentsCount,
      partnersCount,
      applicationsCount,
      universitiesCount,
      programsCount,
      applicationsByStatus,
      recentApplications,
      pendingPartners,
      upcomingMeetings,
      applicationsTrend,
      partnersData,
    ] = await Promise.all([
      // Total students
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student'),
      
      // Total partners
      supabaseAdmin
        .from('partners')
        .select('id', { count: 'exact', head: true }),
      
      // Total applications
      supabaseAdmin
        .from('applications')
        .select('id', { count: 'exact', head: true }),
      
      // Total universities
      supabaseAdmin
        .from('universities')
        .select('id', { count: 'exact', head: true }),
      
      // Total programs
      supabaseAdmin
        .from('programs')
        .select('id', { count: 'exact', head: true }),
      
      // Applications by status
      supabaseAdmin
        .from('applications')
        .select('status'),
      
      // Recent applications (simple select, enriched below)
      supabaseAdmin
        .from('applications')
        .select('id, status, created_at, student_id')
        .order('created_at', { ascending: false })
        .limit(5),

      // Pending partners
      supabaseAdmin
        .from('partners')
        .select('id, company_name as full_name, email, created_at, status as approval_status')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5),

      // Upcoming meetings
      supabaseAdmin
        .from('meetings')
        .select(`
          id,
          title,
          meeting_date,
          status,
          student:users!meetings_student_id_fkey (full_name, email)
        `)
        .gte('meeting_date', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('meeting_date', { ascending: true })
        .limit(5),
      
      // Applications trend (last 7 days)
      supabaseAdmin
        .from('applications')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      
      // Partners for management section
      supabaseAdmin
        .from('partners')
        .select('id, company_name as full_name, email, created_at, status as approval_status')
        .order('created_at', { ascending: false }),
    ]);

    // Process applications by status
    const statusCounts: Record<string, number> = {
      draft: 0,
      submitted: 0,
      under_review: 0,
      document_request: 0,
      interview_scheduled: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0,
    };
    
    for (const app of (applicationsByStatus.data || [])) {
      if (app.status in statusCounts) {
        statusCounts[app.status]++;
      }
    }

    // Process applications trend
    const trendData: { date: string; count: number }[] = [];
    const trendMap = new Map<string, number>();
    
    for (const app of (applicationsTrend.data || [])) {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + 1);
    }
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      trendData.push({
        date,
        count: trendMap.get(date) || 0,
      });
    }

    // Enrich recent applications with student names
    let enrichedRecentApplications: any[] = [];
    const recentAppStudentIds = [...new Set((recentApplications.data || []).map(a => a.student_id).filter(Boolean))];
    if (recentAppStudentIds.length > 0) {
      const { data: studentUsers } = await supabaseAdmin
        .from('students')
        .select('id, user_id, first_name, last_name')
        .in('id', recentAppStudentIds);
      const studentUserIds = [...new Set((studentUsers || []).map(s => s.user_id).filter(Boolean))];
      const { data: usersData } = studentUserIds.length > 0
        ? await supabaseAdmin.from('users').select('id, full_name, email').in('id', studentUserIds)
        : { data: [] };
      const userMap = new Map((usersData || []).map(u => [u.id, u]));
      const studentMap = new Map((studentUsers || []).map(s => [s.id, s]));
      enrichedRecentApplications = (recentApplications.data || []).map(app => {
        const student = studentMap.get(app.student_id);
        const user = student?.user_id ? userMap.get(student.user_id) : null;
        return {
          ...app,
          passport_first_name: student?.first_name || null,
          passport_last_name: student?.last_name || null,
          full_name: user?.full_name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || null,
          email: user?.email || null,
        };
      });
    } else {
      enrichedRecentApplications = recentApplications.data || [];
    }

    // Group partners by status for the dashboard tabs
    const partnersByStatus: Record<string, { id: string; company_name: string; email: string; approval_status: string }[]> = {
      pending: [],
      approved: [],
      rejected: [],
      suspended: [],
    };

    for (const partner of (partnersData.data || []) as unknown as { id: string; full_name: string; email: string; approval_status: string }[]) {
      if (partner.approval_status && partnersByStatus[partner.approval_status]) {
        partnersByStatus[partner.approval_status].push({
          id: partner.id,
          company_name: partner.full_name, // Map full_name back to company_name
          email: partner.email,
          approval_status: partner.approval_status,
        });
      }
    }

    return NextResponse.json({
      stats: {
        students: studentsCount.count || 0,
        partners: partnersCount.count || 0,
        applications: applicationsCount.count || 0,
        universities: universitiesCount.count || 0,
        programs: programsCount.count || 0,
      },
      applicationsByStatus: statusCounts,
      recentApplications: enrichedRecentApplications,
      pendingPartners: pendingPartners.data || [],
      upcomingMeetings: upcomingMeetings.data || [],
      applicationsTrend: trendData,
      partnersByStatus,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
