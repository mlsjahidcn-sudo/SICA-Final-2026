import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    // Fetch meeting with related data
    const { data: meeting, error } = await supabase
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
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching meeting:', error);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Verify partner has access to this meeting
    if (user.role === 'partner') {
      const app = meeting.applications as unknown as Record<string, unknown> | null;
      if (app?.partner_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Normalize meeting data
    const appData = (meeting.applications as unknown as Record<string, unknown> | null) || {};
    const student = (appData.students as unknown as Record<string, unknown> | null) || {};
    const program = (appData.programs as unknown as Record<string, unknown> | null) || {};
    const university = (program.universities as unknown as Record<string, unknown> | null) || {};

    const normalizedMeeting = {
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
      student_name: [student.first_name, student.last_name].filter(Boolean).join(' ') || 'Unknown',
      student_email: student.email || '',
      program_name: program.name || '',
      degree_type: program.degree_level || '',
      university_name: university.name_en || university.name || '',
    };

    return NextResponse.json({ meeting: normalizedMeeting });

  } catch (error) {
    console.error('Meeting detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
