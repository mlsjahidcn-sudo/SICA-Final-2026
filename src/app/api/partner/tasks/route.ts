import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.role;
    if (userRole !== 'partner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Partners can see:
    // 1. Tasks assigned to them
    // 2. Tasks where partner_id is their user ID (since applications.partner_id stores user.id)
    let query = supabase
      .from('admin_tasks')
      .select(`
        *,
        creator:creator_id (
          id,
          email,
          full_name
        ),
        assignee:assignee_id (
          id,
          email,
          full_name
        )
      `);

    // Partners should see tasks where assignee is them OR partner_id is their user ID
    if (userRole === 'partner') {
      query = query.or(`assignee_id.eq.${user.id},partner_id.eq.${user.id}`);
    }

    query = query.order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching partner tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    console.error('Partner tasks GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
