import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    // Get time range from query params (default 30 days)
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const lastPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Get total count and status breakdown
    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('status, created_at, submitted_at')
      .not('status', 'eq', 'draft');
    
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
    const { data: recentApplications, error: recentError } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        submitted_at,
        created_at,
        passport_first_name,
        passport_last_name,
        nationality,
        email,
        programs (
          name_en,
          degree_type,
          universities (
            name_en,
            city
          )
        )
      `)
      .not('status', 'eq', 'draft')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recentError) {
      console.error('Error fetching recent applications:', recentError);
    }
    
    return NextResponse.json({
      stats,
      recentApplications: recentApplications || [],
    });
    
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
