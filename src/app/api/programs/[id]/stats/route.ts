import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/programs/[id]/stats - Get program statistics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch daily stats
    const { data: dailyStats, error } = await supabase
      .from('program_stats')
      .select('*')
      .eq('program_id', id)
      .gte('stat_date', startDate.toISOString().split('T')[0])
      .lte('stat_date', endDate.toISOString().split('T')[0])
      .order('stat_date', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch program statistics' },
        { status: 500 }
      );
    }

    // Calculate aggregates
    const totals = {
      views: 0,
      applications: 0,
      admissions: 0
    };

    dailyStats?.forEach(stat => {
      totals.views += stat.view_count || 0;
      totals.applications += stat.application_count || 0;
      totals.admissions += stat.admission_count || 0;
    });

    // Get current program stats
    const { data: program } = await supabase
      .from('programs')
      .select('view_count, rating, review_count, current_applications, capacity')
      .eq('id', id)
      .single();

    // Get application trend data
    const { data: applicationTrend } = await supabase
      .from('applications')
      .select('created_at, status')
      .eq('program_id', id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    // Group applications by date
    const applicationsByDate: Record<string, { total: number; accepted: number; rejected: number; pending: number }> = {};
    applicationTrend?.forEach(app => {
      const date = new Date(app.created_at).toISOString().split('T')[0];
      if (!applicationsByDate[date]) {
        applicationsByDate[date] = { total: 0, accepted: 0, rejected: 0, pending: 0 };
      }
      applicationsByDate[date].total++;
      if (app.status === 'accepted') applicationsByDate[date].accepted++;
      else if (app.status === 'rejected') applicationsByDate[date].rejected++;
      else applicationsByDate[date].pending++;
    });

    return NextResponse.json({
      program: {
        view_count: program?.view_count || 0,
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
      daily_stats: dailyStats || [],
      application_trend: applicationsByDate
    });
  } catch (error) {
    console.error('Error fetching program statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program statistics' },
      { status: 500 }
    );
  }
}

// POST /api/programs/[id]/stats - Record daily stats (cron job)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const today = new Date().toISOString().split('T')[0];

    // Check if stats already exist for today
    const { data: existingStat } = await supabase
      .from('program_stats')
      .select('id')
      .eq('program_id', id)
      .eq('stat_date', today)
      .single();

    if (existingStat) {
      return NextResponse.json({ message: 'Stats already recorded for today' });
    }

    // Get current view count from programs table
    const { data: program } = await supabase
      .from('programs')
      .select('view_count')
      .eq('id', id)
      .single();

    // Get application count for today
    const { count: applicationCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', id)
      .gte('created_at', today);

    // Get admission count for today
    const { count: admissionCount } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('program_id', id)
      .eq('status', 'accepted')
      .gte('updated_at', today);

    // Insert daily stats
    const { error } = await supabase
      .from('program_stats')
      .insert({
        program_id: id,
        stat_date: today,
        view_count: program?.view_count || 0,
        application_count: applicationCount || 0,
        admission_count: admissionCount || 0
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to record stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      stat_date: today 
    });
  } catch (error) {
    console.error('Error recording program statistics:', error);
    return NextResponse.json(
      { error: 'Failed to record statistics' },
      { status: 500 }
    );
  }
}
