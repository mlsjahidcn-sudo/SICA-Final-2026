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

    // Step 1: Fetch meetings with basic fields only
    let query = supabase
      .from('meetings')
      .select('id, application_id, student_id, title, meeting_date, duration_minutes, platform, meeting_url, meeting_id_text, meeting_password, status, notes, created_by, created_at, updated_at')
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

    const { data: meetingsRaw, error } = await query;

    if (error) {
      console.error('Error fetching meetings:', error);
      return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }

    const meetings = meetingsRaw || [];

    // Step 2: Fetch related users (meetings.student_id references users.id)
    const studentUserIds = [...new Set(meetings.map(m => m.student_id).filter(Boolean))];
    const creatorIds = [...new Set(meetings.map(m => m.created_by).filter(Boolean))];
    const allUserIds = [...new Set([...studentUserIds, ...creatorIds])];

    const usersData: Record<string, { id: string; full_name: string; email: string }> = {};
    if (allUserIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, full_name, email').in('id', allUserIds);
      (users || []).forEach(u => { usersData[u.id] = u; });
    }

    // Step 3: Fetch applications
    const appIds = [...new Set(meetings.map(m => m.application_id).filter(Boolean))];
    const appsData: Record<string, { id: string; status: string; program_id: string | null; student_id: string | null }> = {};
    if (appIds.length > 0) {
      const { data: apps } = await supabase.from('applications').select('id, status, program_id, student_id').in('id', appIds);
      (apps || []).forEach(a => { appsData[a.id] = a; });
    }

    // Step 4: Fetch programs
    const programIds = [...new Set(Object.values(appsData).map(a => a.program_id).filter(Boolean))];
    const programsData: Record<string, { id: string; name: string; university_id: string | null }> = {};
    if (programIds.length > 0) {
      const { data: programs } = await supabase.from('programs').select('id, name, university_id').in('id', programIds);
      (programs || []).forEach(p => { programsData[p.id] = p; });
    }

    // Step 5: Fetch universities
    const universityIds = [...new Set(Object.values(programsData).map(p => p.university_id).filter(Boolean))];
    const universitiesData: Record<string, { id: string; name_en: string | null }> = {};
    if (universityIds.length > 0) {
      const { data: universities } = await supabase.from('universities').select('id, name_en').in('id', universityIds);
      (universities || []).forEach(u => { universitiesData[u.id] = u; });
    }

    // Step 6: Build enriched response matching frontend interface
    const enrichedMeetings = meetings.map(meeting => {
      const studentUser = meeting.student_id ? usersData[meeting.student_id] : null;
      const adminUser = meeting.created_by ? usersData[meeting.created_by] : null;
      const app = meeting.application_id ? appsData[meeting.application_id] : null;
      const program = app?.program_id ? programsData[app.program_id] : null;
      const university = program?.university_id ? universitiesData[program.university_id] : null;

      return {
        id: meeting.id,
        title: meeting.title,
        scheduled_at: meeting.meeting_date,
        meeting_date: meeting.meeting_date,
        duration_minutes: meeting.duration_minutes,
        status: meeting.status,
        meeting_url: meeting.meeting_url,
        meeting_platform: meeting.platform,
        meeting_id_external: meeting.meeting_id_text,
        meeting_password: meeting.meeting_password,
        notes: meeting.notes,
        student_id: meeting.student_id,
        admin_id: meeting.created_by,
        application_id: meeting.application_id,
        created_at: meeting.created_at,
        updated_at: meeting.updated_at,
        student: studentUser ? {
          id: studentUser.id,
          full_name: studentUser.full_name,
          email: studentUser.email,
        } : null,
        admin: adminUser ? {
          id: adminUser.id,
          full_name: adminUser.full_name,
        } : null,
        program_name: program?.name || '-',
        university_name: university?.name_en || '-',
        application_status: app?.status || null,
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
