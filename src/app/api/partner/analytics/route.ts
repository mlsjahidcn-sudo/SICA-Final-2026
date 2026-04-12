import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

interface ApplicationWithRelations {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  program_id: string | null;
  programs: {
    id: string;
    name: string;
    name_en?: string;
    degree_level: string;
    degree_type?: string;
    university_id: string;
    universities: {
      id: string;
      name: string;
      name_en?: string;
    };
  } | null;
}

// Helper to get partner user ID (relaxed - allow any user to test)
function getPartnerUserId(user: { id: string; role: string; partner_id?: string } | null): string | null {
  if (!user) return null;
  // For testing/development: if user is logged in at all, allow them
  if (user.role === 'partner') {
    return user.id;
  }
  if (user.partner_id) {
    return user.partner_id;
  }
  return user.id;
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== Partner Analytics GET called ===');
    const user = await verifyAuthToken(request);
    console.log('verifyAuthToken returned user:', user ? { id: user.id, role: user.role, partner_id: user.partner_id } : null);
    if (!user) {
      console.log('No user - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getSupabaseClient();
    
    // Get partner record (applications.partner_id references partners.id, not users.id)
    const { data: partnerRecord, error: partnerError } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (partnerError || !partnerRecord) {
      console.error('Error fetching partner record:', partnerError);
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 });
    }
    
    const partnerId = partnerRecord.id;
    console.log('Using partnerId:', partnerId);
    
    // Get time range from query params (default 30 days)
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const lastPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Fetch all applications with related data, filtered by partner_id
    let appsQuery = supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        submitted_at,
        program_id,
        programs (
          id,
          name,
          name_en,
          degree_level,
          university_id,
          universities (
            id,
            name,
            name_en
          )
        )
      `)
      .not('status', 'eq', 'draft')
      .eq('partner_id', partnerId);
    
    const { data: applications, error: appsError } = await appsQuery;
    
    if (appsError) {
      console.error('Error fetching applications:', appsError);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    const apps = (applications as unknown as ApplicationWithRelations[]) || [];

    // Calculate Overview Stats
    const totalApplications = apps.length;
    const acceptedCount = apps.filter(a => a.status === 'accepted').length;
    const pendingCount = apps.filter(a => a.status === 'submitted' || a.status === 'under_review').length;
    
    const thisPeriodCount = apps.filter(a => {
      const created = new Date(a.created_at);
      return created >= startDate && created < now;
    }).length;
    
    const lastPeriodCount = apps.filter(a => {
      const created = new Date(a.created_at);
      return created >= lastPeriodStart && created < startDate;
    }).length;
    
    const growth = lastPeriodCount > 0 
      ? Math.round(((thisPeriodCount - lastPeriodCount) / lastPeriodCount) * 100)
      : 0;

    const overview = {
      totalApplications,
      acceptanceRate: totalApplications > 0 ? Math.round((acceptedCount / totalApplications) * 100) : 0,
      pendingRate: totalApplications > 0 ? Math.round((pendingCount / totalApplications) * 100) : 0,
      growth,
    };

    // Calculate Trend Data (daily for the selected period)
    const trendMap = new Map<string, { applications: number; accepted: number; rejected: number }>();
    
    // Initialize all dates in range
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, { applications: 0, accepted: 0, rejected: 0 });
    }
    
    // Fill in actual data
    apps.forEach(app => {
      const dateStr = new Date(app.created_at).toISOString().split('T')[0];
      const entry = trendMap.get(dateStr);
      if (entry) {
        entry.applications++;
        if (app.status === 'accepted') entry.accepted++;
        if (app.status === 'rejected') entry.rejected++;
      }
    });
    
    const trend = Array.from(trendMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate Status Distribution
    const statusCounts: Record<string, number> = {};
    apps.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });
    
    const distribution = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        percentage: totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate University Rankings
    const universityMap = new Map<string, { name: string; applications: number; accepted: number }>();
    
    apps.forEach(app => {
      const universityData = app.programs?.universities;
      const uniName = universityData?.name_en || universityData?.name || 'Unknown';
      const entry = universityMap.get(uniName) || { name: uniName, applications: 0, accepted: 0 };
      entry.applications++;
      if (app.status === 'accepted') entry.accepted++;
      universityMap.set(uniName, entry);
    });
    
    const universities = Array.from(universityMap.values())
      .map(u => ({
        ...u,
        acceptanceRate: u.applications > 0 ? Math.round((u.accepted / u.applications) * 100) : 0,
      }))
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);

    // Calculate Program Analytics
    const programMap = new Map<string, { name: string; degree: string; applications: number }>();
    
    apps.forEach(app => {
      const programData = app.programs;
      const progName = programData?.name_en || programData?.name || 'Unknown';
      const degreeType = programData?.degree_level || 'Unknown';
      const key = `${progName}-${degreeType}`;
      const entry = programMap.get(key) || { 
        name: progName, 
        degree: degreeType, 
        applications: 0 
      };
      entry.applications++;
      programMap.set(key, entry);
    });
    
    const programs = Array.from(programMap.values())
      .sort((a, b) => b.applications - a.applications)
      .slice(0, 10);

    // Calculate Conversion Funnel
    const funnel = {
      submitted: apps.filter(a => a.status !== 'draft').length,
      underReview: apps.filter(a => ['under_review', 'interview_scheduled', 'accepted'].includes(a.status)).length,
      interview: apps.filter(a => ['interview_scheduled', 'accepted'].includes(a.status)).length,
      accepted: acceptedCount,
    };

    return NextResponse.json({
      overview,
      trend,
      distribution,
      universities,
      programs,
      funnel,
    });
    
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
