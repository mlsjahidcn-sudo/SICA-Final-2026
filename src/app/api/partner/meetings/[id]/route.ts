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

    // Step 1: Fetch meeting with basic fields only
    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('id, application_id, student_id, title, meeting_date, duration_minutes, platform, meeting_url, meeting_id_text, meeting_password, status, created_by, created_at, updated_at')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching meeting:', error);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Step 2: Fetch related data
    let applicationData: { partner_id: string | null; program_id: string | null } | null = null;
    if (meeting.application_id) {
      const { data: app } = await supabase
        .from('applications')
        .select('partner_id, program_id')
        .eq('id', meeting.application_id)
        .maybeSingle();
      applicationData = app;
    }

    // Verify partner has access to this meeting
    if (user.role === 'partner') {
      const { data: partnerRecord, error: partnerError } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (partnerError || !partnerRecord) {
        return NextResponse.json({ error: 'Partner record not found' }, { status: 403 });
      }

      if (applicationData?.partner_id !== partnerRecord.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Step 3: Fetch program, university, and student data
    let programData: { name: string; degree_level: string; university_id: string | null } | null = null;
    if (applicationData?.program_id) {
      const { data: program } = await supabase
        .from('programs')
        .select('name, degree_level, university_id')
        .eq('id', applicationData.program_id)
        .maybeSingle();
      programData = program;
    }

    let universityData: { name: string; name_en: string | null } | null = null;
    if (programData?.university_id) {
      const { data: university } = await supabase
        .from('universities')
        .select('name, name_en')
        .eq('id', programData.university_id)
        .maybeSingle();
      universityData = university;
    }

    let studentData: { first_name: string; last_name: string; user_id: string | null } | null = null;
    let studentUserEmail = '';
    if (meeting.student_id) {
      const { data: student } = await supabase
        .from('students')
        .select('first_name, last_name, user_id')
        .eq('id', meeting.student_id)
        .maybeSingle();
      studentData = student;

      if (student?.user_id) {
        const { data: userData } = await supabase
          .from('users')
          .select('email')
          .eq('id', student.user_id)
          .maybeSingle();
        studentUserEmail = userData?.email || '';
      }
    }

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
      student_name: [studentData?.first_name, studentData?.last_name].filter(Boolean).join(' ') || 'Unknown',
      student_email: studentUserEmail,
      program_name: programData?.name || '',
      degree_type: programData?.degree_level || '',
      university_name: universityData?.name_en || universityData?.name || '',
    };

    return NextResponse.json({ meeting: normalizedMeeting });

  } catch (error) {
    console.error('Meeting detail API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
