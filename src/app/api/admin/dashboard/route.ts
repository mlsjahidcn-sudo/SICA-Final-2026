import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Get admin client lazily
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userRole = user.user_metadata?.role;
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      
      // Recent applications
      supabaseAdmin
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          passport_first_name,
          passport_last_name,
          users (full_name, email)
        `)
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
          scheduled_at,
          status,
          student:users!meetings_student_id_fkey (full_name, email)
        `)
        .gte('scheduled_at', new Date().toISOString())
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
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
      recentApplications: recentApplications.data || [],
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
