import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabaseAdmin = getSupabaseClient();
    
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userRole = user.user_metadata?.role;
    if (userRole !== 'partner' && userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    // Get user's partner_id from users table
    const { data: userProfile } = await supabase
      .from('users')
      .select('id, partner_id')
      .eq('id', user.id)
      .single();

    const partnerId = userProfile?.partner_id;

    // Partners can see:
    // 1. Tasks assigned to them
    // 2. Tasks related to their partner ID (if partnerId exists)
    let query = supabase
      .from('admin_tasks')
      .select(`
        *,
        creator:creator_id (
          id,
          email,
          raw_user_meta_data
        ),
        assignee:assignee_id (
          id,
          email,
          raw_user_meta_data
        ),
        admin_task_comments (
          id,
          content,
          created_at,
          user:user_id (
            id,
            email,
            raw_user_meta_data
          )
        ),
        admin_task_subtasks (
          id,
          title,
          completed,
          order_index
        )
      `);

    if (partnerId) {
      query = query.or(`assignee_id.eq.${user.id},partner_id.eq.${partnerId}`);
    } else {
      query = query.eq('assignee_id', user.id);
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
