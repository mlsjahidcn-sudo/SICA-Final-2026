import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    
    // meeting_details view doesn't exist - use meetings table with joins
    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('id, application_id, student_id, title, meeting_date, duration_minutes, platform, meeting_url, status, notes, created_by, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error || !meeting) {
      console.error('Error fetching meeting:', error);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Enrich with step-by-step queries (meetings.student_id references users.id)
    let studentUser: { full_name: string; email: string; phone: string | null } | null = null;
    if (meeting.student_id) {
      const { data: user } = await supabase.from('users').select('full_name, email, phone').eq('id', meeting.student_id).single();
      studentUser = user || null;
    }

    let application: { status: string; program_id: string | null } | null = null;
    let program: { name: string; university_id: string | null } | null = null;
    let university: { name_en: string | null } | null = null;

    if (meeting.application_id) {
      const { data: app } = await supabase.from('applications').select('status, program_id').eq('id', meeting.application_id).single();
      application = app || null;
      if (app?.program_id) {
        const { data: prog } = await supabase.from('programs').select('name, university_id').eq('id', app.program_id).single();
        program = prog || null;
        if (prog?.university_id) {
          const { data: univ } = await supabase.from('universities').select('name_en').eq('id', prog.university_id).single();
          university = univ || null;
        }
      }
    }

    const enriched = {
      ...meeting,
      student_name: studentUser?.full_name || '-',
      student_email: studentUser?.email || '-',
      student_phone: studentUser?.phone || null,
      program_name: program?.name || null,
      university_name: university?.name_en || null,
      application_status: application?.status || null,
    };

    return NextResponse.json({ meeting: enriched });
    
  } catch (error) {
    console.error('Get meeting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Only update provided fields that exist on the meetings table
    const allowedFields = [
      'title', 'meeting_date', 'duration_minutes',
      'platform', 'meeting_url', 'notes', 'status'
    ];
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }
    
    const { data: meeting, error } = await supabase
      .from('meetings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating meeting:', error);
      return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
    }
    
    return NextResponse.json({ meeting });
    
  } catch (error) {
    console.error('Update meeting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const cancelledBy = body.cancelled_by;
    const reason = body.reason;
    
    // Get meeting details before cancelling
    const { data: meeting } = await supabase
      .from('meetings')
      .select('application_id')
      .eq('id', id)
      .single();
    
    // Update status to cancelled instead of deleting
    const { error } = await supabase
      .from('meetings')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelled: ${reason}` : 'Meeting cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error cancelling meeting:', error);
      return NextResponse.json({ error: 'Failed to cancel meeting' }, { status: 500 });
    }
    
    // Update application status back to under_review
    if (meeting?.application_id) {
      await supabase
        .from('applications')
        .update({ status: 'under_review', updated_at: new Date().toISOString() })
        .eq('id', meeting.application_id);
      
      // Log status change in assessment_status_history
      // (application_status_history doesn't exist)
      if (cancelledBy) {
        await supabase
          .from('assessment_status_history')
          .insert({
            application_id: meeting.application_id,
            old_status: 'interview_scheduled',
            new_status: 'under_review',
            changed_by: cancelledBy,
            notes: 'Meeting cancelled, status reverted to under review',
          });
      }
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Cancel meeting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
