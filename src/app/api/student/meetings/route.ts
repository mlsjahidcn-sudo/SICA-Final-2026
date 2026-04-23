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

    // meetings.student_id references users.id directly
    const studentId = user.id;

    let query = supabase
      .from('meetings')
      .select('id, title, meeting_date, duration_minutes, platform, meeting_url, meeting_id, meeting_password, status, notes, created_at, application_id')
      .eq('student_id', studentId);

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

    const { data: meetingsRaw, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    // Enrich with program/university info (step-by-step)
    const appIds = (meetingsRaw || []).map(m => m.application_id).filter(Boolean);
    let meetings: any[] = [];
    if (appIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('id, program_id')
        .in('id', appIds);
      const programIds = (apps || []).map(a => a.program_id).filter(Boolean);
      const { data: programs } = programIds.length > 0
        ? await supabase.from('programs').select('id, name, university_id').in('id', programIds)
        : { data: [] };
      const uniIds = (programs || []).map(p => p.university_id).filter(Boolean);
      const { data: universities } = uniIds.length > 0
        ? await supabase.from('universities').select('id, name_en, logo_url').in('id', uniIds)
        : { data: [] };

      const appMap = Object.fromEntries((apps || []).map(a => [a.id, a]));
      const progMap = Object.fromEntries((programs || []).map(p => [p.id, p]));
      const uniMap = Object.fromEntries((universities || []).map(u => [u.id, u]));

      meetings = (meetingsRaw || []).map(m => {
        const app = m.application_id ? appMap[m.application_id] : null;
        const prog = app ? progMap[app.program_id] : null;
        const uni = prog ? uniMap[prog.university_id] : null;
        return {
          ...m,
          applications: app ? {
            id: app.id,
            programs: prog ? {
              id: prog.id,
              name: prog.name,
              name_en: prog.name,
              universities: uni ? { id: uni.id, name_en: uni.name_en, logo_url: uni.logo_url } : null,
            } : null,
          } : null,
        };
      });
    } else {
      meetings = meetingsRaw || [];
    }

    return NextResponse.json({ meetings });

  } catch (error) {
    console.error('Error in student meetings GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
