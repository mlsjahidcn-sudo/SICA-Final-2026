import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// Helper to get partner ID for the current user
function getPartnerIdForUser(user: { id: string; role: string; partner_id?: string } | null): string | null {
  if (user?.role === 'partner') {
    return user.id;
  }
  if (user?.partner_id) {
    return user.partner_id;
  }
  return null;
}

// GET /api/applications/[id]/timeline - Get application status history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // First verify the user has access to this application
    let accessQuery = supabase
      .from('applications')
      .select('id')
      .eq('id', id);

    if (user.role === 'student') {
      const { data: studentRecord } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!studentRecord) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
      }
      
      accessQuery = accessQuery.eq('student_id', studentRecord.id);
    } else if (user.role === 'partner' || user.partner_id) {
      const partnerId = getPartnerIdForUser(user);
      if (partnerId) {
        accessQuery = accessQuery.eq('partner_id', partnerId);
      }
    }

    const { data: application, error: accessError } = await accessQuery.single();

    if (accessError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get timeline
    const { data: timeline, error } = await supabase
      .from('application_status_history')
      .select(`
        id,
        old_status,
        new_status,
        changed_at,
        notes,
        users (
          id,
          full_name,
          email
        )
      `)
      .eq('application_id', id)
      .order('changed_at', { ascending: true });

    if (error) {
      console.error('Error fetching timeline:', error);
      return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
    }

    return NextResponse.json({
      events: timeline?.map(event => {
        const eventUser = Array.isArray(event.users) ? event.users[0] : event.users;
        return {
          id: event.id,
          old_status: event.old_status,
          new_status: event.new_status,
          changed_at: event.changed_at,
          changed_by_name: eventUser?.full_name,
          notes: event.notes
        };
      }) || []
    });

  } catch (error) {
    console.error('Error in timeline GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
