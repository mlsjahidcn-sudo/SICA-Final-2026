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

    // Build query for admin_tasks (without joins - PostgREST schema cache may not be refreshed)
    let query = supabase
      .from('admin_tasks')
      .select('*');

    // Partners should see tasks where assignee is them OR partner_id is their user ID
    if (userRole === 'partner') {
      query = query.or(`assignee_id.eq.${user.id},partner_id.eq.${user.id}`);
    }

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching partner tasks:', JSON.stringify(error));
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    const tasks = data || [];

    // Collect unique creator_id and assignee_id values to batch-fetch user info
    const userIds = new Set<string>();
    for (const task of tasks) {
      if (task.creator_id) userIds.add(task.creator_id);
      if (task.assignee_id) userIds.add(task.assignee_id);
    }

    // Fetch user info for all referenced users
    let userMap: Record<string, { id: string; email: string; full_name: string }> = {};
    if (userIds.size > 0) {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));

      if (!usersError && users) {
        for (const u of users) {
          userMap[u.id] = u;
        }
      }
    }

    // Enrich tasks with creator/assignee info
    const enrichedTasks = tasks.map(task => ({
      ...task,
      creator: task.creator_id ? (userMap[task.creator_id] || null) : null,
      assignee: task.assignee_id ? (userMap[task.assignee_id] || null) : null,
    }));

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error('Partner tasks GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'partner' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();

    const { title, description, priority, due_date, assignee_id, related_to_type, related_to_id } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('admin_tasks')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        status: 'todo',
        priority: priority || 'medium',
        due_date: due_date || null,
        creator_id: user.id,
        creator_role: user.role,
        assignee_id: assignee_id || null,
        assignee_role: assignee_id ? 'partner' : null,
        related_to_type: related_to_type || null,
        related_to_id: related_to_id || null,
        partner_id: user.role === 'partner' ? user.id : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Partner tasks POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
