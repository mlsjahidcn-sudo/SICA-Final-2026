import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

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
    console.log('=== Partner Dashboard GET called ===');
    const user = await verifyAuthToken(request);
    console.log('verifyAuthToken returned user:', user ? { id: user.id, role: user.role, partner_id: user.partner_id } : null);
    if (!user) {
      console.log('No user - returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const partnerId = getPartnerUserId(user);
    console.log('Using partnerId:', partnerId);

    const supabase = getSupabaseClient();
    
    // Get time range from query params (default 30 days)
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const lastPeriodStart = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    // Get total count and status breakdown
    let appsQuery = supabase
      .from('applications')
      .select('status, created_at, submitted_at')
      .not('status', 'eq', 'draft')
      .eq('partner_id', partnerId);
    
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
    let recentQuery = supabase
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
          email
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
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    const { data: recentApplications, error: recentError } = await recentQuery;
    
    if (recentError) {
      console.error('Error fetching recent applications:', recentError);
    }

    // Normalize recent applications (handle arrays from Supabase relations)
    const normalizedRecent = recentApplications?.map(app => {
      const student = Array.isArray(app.students) ? app.students[0] : app.students;
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
        email: student?.email,
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
