import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/meetings - List student's meetings
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';

    let query = supabase
      .from('meetings')
      .select(`
        id,
        title,
        meeting_date,
        duration_minutes,
        platform,
        meeting_url,
        meeting_id,
        meeting_password,
        status,
        notes,
        created_at,
        applications (
          id,
          programs (
            id,
            name_en,
            universities (
              id,
              name_en,
              logo_url
            )
          )
        )
      `)
      .eq('student_id', user.id);

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Filter upcoming meetings
    if (upcoming) {
      query = query
        .eq('status', 'scheduled')
        .gte('meeting_date', new Date().toISOString());
    }

    query = query.order('meeting_date', { ascending: true });

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    return NextResponse.json({ meetings: meetings || [] });

  } catch (error) {
    console.error('Error in student meetings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
