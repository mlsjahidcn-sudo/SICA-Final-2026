import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

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

    // First check if user has access to this application
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select('id, student_id, partner_id')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const isStudent = application.student_id === user.id;
    const isPartner = application.partner_id === user.id;
    const isAdmin = user.role === 'admin';

    if (!isStudent && !isPartner && !isAdmin) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch status history with user info
    const { data: history, error } = await supabase
      .from('application_status_history')
      .select(`
        id,
        old_status,
        new_status,
        changed_at,
        changed_by,
        notes,
        users:changed_by (
          full_name
        )
      `)
      .eq('application_id', id)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching timeline:', error);
      return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
    }

    // Transform the data
    const events = (history || []).map((event) => ({
      id: event.id,
      old_status: event.old_status,
      new_status: event.new_status,
      changed_at: event.changed_at,
      changed_by_name: (event.users as unknown as { full_name: string })?.full_name || 'System',
      notes: event.notes,
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error in timeline GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
