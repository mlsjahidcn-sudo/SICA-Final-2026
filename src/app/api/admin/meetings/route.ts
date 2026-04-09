import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const status = request.nextUrl.searchParams.get('status');
    const applicationId = request.nextUrl.searchParams.get('application_id');
    const upcoming = request.nextUrl.searchParams.get('upcoming');
    
    let query = supabase
      .from('meeting_details')
      .select('*')
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
    
    return NextResponse.json({ meetings });
    
  } catch (error) {
    console.error('Admin meetings API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    
    const {
      application_id,
      student_id,
      scheduled_by,
      title,
      description,
      meeting_date,
      duration_minutes = 30,
      meeting_type = 'video',
      platform,
      meeting_url,
      meeting_id_external,
      meeting_password,
      notes,
    } = body;
    
    // Validate required fields
    if (!application_id || !student_id || !scheduled_by || !title || !meeting_date) {
      return NextResponse.json({ 
        error: 'Missing required fields: application_id, student_id, scheduled_by, title, meeting_date' 
      }, { status: 400 });
    }
    
    // Create the meeting
    const { data: meeting, error } = await supabase
      .from('meetings')
      .insert({
        application_id,
        student_id,
        scheduled_by,
        title,
        description,
        meeting_date,
        duration_minutes,
        meeting_type,
        platform,
        meeting_url,
        meeting_id_external,
        meeting_password,
        notes,
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
    
    // Log status change
    await supabase
      .from('application_status_history')
      .insert({
        application_id,
        status: 'interview_scheduled',
        changed_by: scheduled_by,
        notes: `Meeting scheduled: ${title}`,
      });
    
    return NextResponse.json({ meeting }, { status: 201 });
    
  } catch (error) {
    console.error('Create meeting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
