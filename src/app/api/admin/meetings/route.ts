import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    
    const status = request.nextUrl.searchParams.get('status');
    const applicationId = request.nextUrl.searchParams.get('application_id');
    const upcoming = request.nextUrl.searchParams.get('upcoming');
    
    // meeting_details view doesn't exist - query meetings table directly with joins
    // meetings table columns: id, application_id, student_id, title, meeting_date,
    //   duration_minutes, platform, meeting_url, status, notes, created_by, created_at, updated_at
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
        status,
        notes,
        created_by,
        created_at,
        updated_at,
        students (
          id,
          user_id,
          first_name,
          last_name,
          nationality,
          users (
            id,
            full_name,
            email
          )
        ),
        applications (
          id,
          status,
          programs (
            id,
            name,
            universities (
              id,
              name_en
            )
          )
        )
      `)
      .order('meeting_date', { ascending: true });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }
    
    if (upcoming === 'true') {
      query = query.gte('meeting_date', new Date().toISOString());
    }
    
    const { data: meetings, error } = await query;
    
    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    // Flatten student and application data for easier frontend consumption
    const enrichedMeetings = (meetings || []).map(meeting => {
      const student = Array.isArray(meeting.students) ? meeting.students[0] : meeting.students;
      const studentUser = student?.users
        ? (Array.isArray(student.users) ? student.users[0] : student.users)
        : null;
      const application = Array.isArray(meeting.applications) ? meeting.applications[0] : meeting.applications;
      const program = application?.programs
        ? (Array.isArray(application.programs) ? application.programs[0] : application.programs)
        : null;
      const university = program?.universities
        ? (Array.isArray(program.universities) ? program.universities[0] : program.universities)
        : null;

      return {
        ...meeting,
        student_name: studentUser?.full_name || [student?.first_name, student?.last_name].filter(Boolean).join(' ') || '-',
        student_email: studentUser?.email || '-',
        student_nationality: student?.nationality || null,
        program_name: program?.name || '-',
        university_name: university?.name_en || '-',
        application_status: application?.status || null,
      };
    });
    
    return NextResponse.json({ meetings: enrichedMeetings });
    
  } catch (error) {
    console.error('Admin meetings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const {
      application_id,
      student_id,
      title,
      meeting_date,
      duration_minutes = 30,
      platform,
      meeting_url,
      notes,
    } = body;
    
    // Validate required fields
    // meetings table requires: application_id, student_id, title, meeting_date
    // created_by replaces scheduled_by, notes replaces description
    if (!application_id || !student_id || !title || !meeting_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: application_id, student_id, title, meeting_date' 
      }, { status: 400 });
    }

    // Get admin user ID for created_by
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    let createdById: string | undefined;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      createdById = user?.id;
    }
    
    // Create the meeting - only use columns that exist on meetings table
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        application_id,
        student_id,
        title,
        meeting_date,
        duration_minutes,
        platform,
        meeting_url,
        notes,
        created_by: createdById || null,
        status: 'scheduled',
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating meeting:', error);
      return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }
    
    // Update application status to interview_scheduled
    await supabase
      .from('applications')
      .update({ status: 'interview_scheduled', updated_at: new Date().toISOString() })
      .eq('id', application_id);
    
    // Log status change in assessment_status_history
    // (application_status_history doesn't exist)
    if (createdById) {
      await supabase
        .from('assessment_status_history')
        .insert({
          application_id,
          old_status: 'under_review',
          new_status: 'interview_scheduled',
          changed_by: createdById,
          notes: `Meeting scheduled: ${title}`,
        });
    }
    
    return NextResponse.json({ meeting }, { status: 201 });
    
  } catch (error) {
    console.error('Create meeting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
