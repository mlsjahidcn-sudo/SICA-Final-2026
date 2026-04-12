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

    // Build query - join with applications and students for details
    let query = supabase
      .from('meetings')
      .select(`
        id,
        application_id,
        student_id,
        title,
        meeting_date,
        duration_minutes,
        platform,
        meeting_url,
        meeting_id_text,
        meeting_password,
        status,
        created_by,
        created_at,
        updated_at,
        applications (
          id,
          partner_id,
          programs (
            name,
            degree_level,
            universities (
              name,
              name_en
            )
          ),
          students (
            first_name,
            last_name,
            email
          )
        )
      `)
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

    // Filter by partner scope and normalize data
    let filteredMeetings = meetings || [];

    if (user.role === 'partner') {
      // Partners can only see meetings related to their applications
      filteredMeetings = filteredMeetings.filter((meeting: Record<string, unknown>) => {
        const app = meeting.applications as unknown as Record<string, unknown> | null;
        return app?.partner_id === user.id;
      });
    }

    // Normalize meeting data for frontend
    const normalizedMeetings = filteredMeetings.map((meeting: Record<string, unknown>) => {
      const app = (meeting.applications as unknown as Record<string, unknown> | null) || {};
      const student = (app.students as unknown as Record<string, unknown> | null) || {};
      const program = (app.programs as unknown as Record<string, unknown> | null) || {};
      const university = (program.universities as unknown as Record<string, unknown> | null) || {};

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
        student_name: [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Unknown',
        student_email: student.email || '',
        program_name: program.name || '',
        university_name: university.name_en || university.name || '',
      };
    });

    return NextResponse.json({ meetings: normalizedMeetings });

  } catch (error) {
    console.error('Meetings API error:', error);
    return NextResponse.json({ meetings: [], error: 'Internal server error' }, { status: 500 });
  }
}
