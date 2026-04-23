import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();

    // Get query params
    const status = request.nextUrl.searchParams.get('status') || 'all';

    // Step 1: Fetch meetings with basic fields only (no nested relations)
    let query = supabase
      .from('meetings')
      .select('id, application_id, student_id, title, meeting_date, duration_minutes, platform, meeting_url, meeting_id_text, meeting_password, status, created_by, created_at, updated_at')
      .order('meeting_date', { ascending: true });

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: meetings, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ meetings: [] });
    }

    if (!meetings || meetings.length === 0) {
      return NextResponse.json({ meetings: [] });
    }

    // Step 2: Get application IDs from meetings
    const applicationIds = meetings
      .map(m => m.application_id)
      .filter((id): id is string => !!id);
    const studentIds = meetings
      .map(m => m.student_id)
      .filter((id): id is string => !!id);

    // Step 3: Fetch applications data
    let applicationsData: Record<string, {
      partner_id: string | null;
      program_id: string | null;
      student_id: string | null;
    }> = {};

    if (applicationIds.length > 0) {
      const { data: apps } = await supabase
        .from('applications')
        .select('id, partner_id, program_id, student_id')
        .in('id', applicationIds);

      (apps || []).forEach(app => {
        applicationsData[app.id] = app;
      });
    }

    // Step 4: Fetch programs data
    const programIds = Object.values(applicationsData)
      .map(a => a.program_id)
      .filter((id): id is string => !!id);

    let programsData: Record<string, { name: string; degree_level: string; university_id: string | null }> = {};

    if (programIds.length > 0) {
      const { data: programs } = await supabase
        .from('programs')
        .select('id, name, degree_level, university_id')
        .in('id', programIds);

      (programs || []).forEach(p => {
        programsData[p.id] = p;
      });
    }

    // Step 5: Fetch universities data
    const universityIds = Object.values(programsData)
      .map(p => p.university_id)
      .filter((id): id is string => !!id);

    let universitiesData: Record<string, { name: string; name_en: string | null }> = {};

    if (universityIds.length > 0) {
      const { data: universities } = await supabase
        .from('universities')
        .select('id, name, name_en')
        .in('id', universityIds);

      (universities || []).forEach(u => {
        universitiesData[u.id] = u;
      });
    }

    // Step 6: Fetch students data
    let studentsData: Record<string, { first_name: string; last_name: string; email: string }> = {};

    if (studentIds.length > 0) {
      const { data: students } = await supabase
        .from('students')
        .select('id, first_name, last_name, email')
        .in('id', studentIds);

      (students || []).forEach(s => {
        studentsData[s.id] = s;
      });
    }

    // Step 7: Filter by partner scope and normalize data
    let filteredMeetings = meetings;

    if (user.role === 'partner') {
      // Partners can only see meetings related to their applications
      filteredMeetings = meetings.filter(m => {
        const app = m.application_id ? applicationsData[m.application_id] : null;
        return app?.partner_id === user.id;
      });
    }

    // Normalize meeting data for frontend
    const normalizedMeetings = filteredMeetings.map(meeting => {
      const app = meeting.application_id ? applicationsData[meeting.application_id] : null;
      const student = meeting.student_id ? studentsData[meeting.student_id] : null;
      const program = app?.program_id ? programsData[app.program_id] : null;
      const university = program?.university_id ? universitiesData[program.university_id] : null;

      return {
        id: meeting.id,
        application_id: meeting.application_id,
        student_id: meeting.student_id,
        title: meeting.title,
        meeting_date: meeting.meeting_date,
        duration_minutes: meeting.duration_minutes,
        platform: meeting.platform,
        meeting_url: meeting.meeting_url,
        meeting_id_external: meeting.meeting_id_text,
        meeting_password: meeting.meeting_password,
        status: meeting.status,
        created_by: meeting.created_by,
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
        // Flattened related data
        student_name: [student?.first_name, student?.last_name].filter(Boolean).join(' ') || 'Unknown',
        student_email: student?.email || '',
        program_name: program?.name || '',
        university_name: university?.name_en || university?.name || '',
      };
    });

    return NextResponse.json({ meetings: normalizedMeetings });

  } catch (error) {
    console.error('Meetings API error:', error);
    return NextResponse.json({ meetings: [], error: 'Internal server error' }, { status: 500 });
  }
}
