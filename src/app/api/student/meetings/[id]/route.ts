import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/meetings/[id] - Get meeting details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // meetings.student_id references users.id directly
    const studentId = user.id;

    const { data: meetingRaw, error } = await supabase
      .from('meetings')
      .select('id, title, meeting_date, duration_minutes, platform, meeting_url, meeting_id, meeting_password, status, notes, created_at, updated_at, application_id, interviewer_id')
      .eq('id', id)
      .eq('student_id', studentId)
      .single();

    if (error || !meetingRaw) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Enrich with application/program/university info
    let application = null;
    if (meetingRaw.application_id) {
      const { data: app } = await supabase
        .from('applications')
        .select('id, status, program_id')
        .eq('id', meetingRaw.application_id)
        .single();
      if (app) {
        const { data: prog } = await supabase
          .from('programs')
          .select('id, name, name_cn, degree_type, university_id')
          .eq('id', app.program_id)
          .single();
        let university = null;
        if (prog?.university_id) {
          const { data: uni } = await supabase
            .from('universities')
            .select('id, name_en, name_cn, city, logo_url')
            .eq('id', prog.university_id)
            .single();
          university = uni;
        }
        application = {
          id: app.id,
          status: app.status,
          programs: prog ? {
            id: prog.id,
            name: prog.name,
            name_en: prog.name,
            name_cn: prog.name_cn || prog.name,
            degree_type: prog.degree_type,
            universities: university,
          } : null,
        };
      }
    }

    // Get interviewer info
    let interviewer = null;
    if (meetingRaw.interviewer_id) {
      const { data: interviewerUser } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .eq('id', meetingRaw.interviewer_id)
        .single();
      interviewer = interviewerUser;
    }

    const meeting = {
      ...meetingRaw,
      applications: application,
      users: interviewer,
    };

    return NextResponse.json({ meeting });

  } catch (error) {
    console.error('Error in meeting GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
