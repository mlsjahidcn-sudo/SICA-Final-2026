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

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assigneeId = searchParams.get('assigneeId');
    const relatedToType = searchParams.get('relatedToType');
    const relatedToId = searchParams.get('relatedToId');

    // Query admin_tasks with related sub-tables
    // Note: creator_id/assignee_id reference auth.users which can't be joined via PostgREST
    // We fetch user info separately after getting tasks
    let query = supabase
      .from('admin_tasks')
      .select(`
        *,
        admin_task_comments (
          id,
          content,
          user_id,
          user_role,
          created_at
        ),
        admin_task_subtasks (
          id,
          title,
          completed,
          order_index
        ),
        admin_task_attachments (
          id,
          file_name,
          file_size,
          content_type,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assigneeId) {
      query = query.eq('assignee_id', assigneeId);
    }

    if (relatedToType) {
      query = query.eq('related_to_type', relatedToType);
    }

    if (relatedToId) {
      query = query.eq('related_to_id', relatedToId);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching admin tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
    }

    // Collect all user IDs that need name lookups
    const userIds = new Set<string>();
    for (const task of (tasks || [])) {
      if (task.creator_id) userIds.add(task.creator_id);
      if (task.assignee_id) userIds.add(task.assignee_id);
      for (const comment of (task.admin_task_comments || [])) {
        if (comment.user_id) userIds.add(comment.user_id);
      }
    }

    // Fetch user info from public.users table for name resolution
    const userMap = new Map<string, { full_name: string; email: string }>();
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', Array.from(userIds));
      
      for (const u of (users || [])) {
        userMap.set(u.id, { full_name: u.full_name, email: u.email });
      }
    }

    // Enrich tasks with user info
    const enrichedTasks = (tasks || []).map(task => ({
      ...task,
      creator: task.creator_id ? userMap.get(task.creator_id) || null : null,
      assignee: task.assignee_id ? userMap.get(task.assignee_id) || null : null,
      admin_task_comments: (task.admin_task_comments || []).map((comment: { user_id?: string; [key: string]: unknown }) => ({
        ...comment,
        user: comment.user_id ? userMap.get(comment.user_id) || null : null,
      })),
    }));

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error('Error in admin tasks GET:', error);
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

    // Get admin user ID from auth
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    let creatorId: string | undefined;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      creatorId = user?.id;
    }

    const { title, description, status, priority, due_date, assignee_id, assignee_role, related_to_type, related_to_id, partner_id } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('admin_tasks')
      .insert({
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        due_date,
        assignee_id,
        assignee_role,
        creator_id: creatorId || null,
        creator_role: 'admin',
        related_to_type,
        related_to_id,
        partner_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error in admin tasks POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
