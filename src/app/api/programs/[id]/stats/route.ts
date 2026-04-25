import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const supabase = getSupabaseClient();

    // Get program existence check
    const { data: program } = await supabase
      .from('programs')
      .select('id, name, rating, review_count, current_applications, capacity')
      .eq('id', id)
      .single();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get applications for this program in the date range
    const { data: applications, error: appError } = await supabase
      .from('applications')
      .select('created_at, status')
      .eq('program_id', id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (appError) {
      console.error('Error fetching application stats:', appError);
    }

    // Process daily stats
    const dailyStats: Record<string, { total: number; by_status: Record<string, number> }> = {};
    const applicationsByDate: Record<string, number> = {};

    (applications || []).forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { total: 0, by_status: {} };
      }
      dailyStats[date].total++;
      dailyStats[date].by_status[app.status] = (dailyStats[date].by_status[app.status] || 0) + 1;
      applicationsByDate[date] = (applicationsByDate[date] || 0) + 1;
    });

    // Calculate totals
    const totalApplications = (applications || []).length;
    const totalAccepted = (applications || []).filter(a => a.status === 'accepted').length;
    const totalRejected = (applications || []).filter(a => a.status === 'rejected').length;

    const totals = {
      total_applications: totalApplications,
      accepted: totalAccepted,
      rejected: totalRejected,
      acceptance_rate: totalApplications > 0 ? (totalAccepted / totalApplications * 100).toFixed(1) : '0',
    };

    return NextResponse.json({
      program: {
        rating: program?.rating || 0,
        review_count: program?.review_count || 0,
        current_applications: program?.current_applications || 0,
        capacity: program?.capacity
      },
      period: {
        days,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      },
      totals,
      daily_stats: dailyStats,
      application_trend: applicationsByDate
    });
  } catch (error) {
    console.error('Error in program stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
