import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { id } = await params;
    
    const { data: meeting, error } = await supabase
      .from('meeting_details')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching meeting:', error);
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }
    
    return NextResponse.json({ meeting });
    
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
    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    
    // Only update provided fields
    const allowedFields = [
      'title', 'description', 'meeting_date', 'duration_minutes',
      'meeting_type', 'platform', 'meeting_url', 'meeting_id_external',
      'meeting_password', 'notes', 'status'
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
      
      // Log status change
      await supabase
        .from('application_status_history')
        .insert({
          application_id: meeting.application_id,
          status: 'under_review',
          changed_by: cancelledBy,
          notes: 'Meeting cancelled, status reverted to under review',
        });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Cancel meeting API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
