import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Note: creator_id/assignee_id/user_id reference auth.users which can't be joined via PostgREST
    // We fetch the task first, then look up user names from public.users separately
    const { data, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json(
        { error: 'Failed to fetch task' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Collect user IDs for name resolution
    const userIds = new Set<string>();
    if (data.creator_id) userIds.add(data.creator_id);
    if (data.assignee_id) userIds.add(data.assignee_id);
    for (const comment of (data.admin_task_comments || [])) {
      if (comment.user_id) userIds.add(comment.user_id);
    }

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

    const enrichedTask = {
      ...data,
      creator: data.creator_id ? userMap.get(data.creator_id) || null : null,
      assignee: data.assignee_id ? userMap.get(data.assignee_id) || null : null,
      admin_task_comments: (data.admin_task_comments || []).map((comment: { user_id?: string; [key: string]: unknown }) => ({
        ...comment,
        user: comment.user_id ? userMap.get(comment.user_id) || null : null,
      })),
    };

    return NextResponse.json({ task: enrichedTask });
  } catch (error) {
    console.error('Task GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
      assigneeRole,
      relatedToType,
      relatedToId,
      partnerId,
      completedAt,
    } = body;

    interface TaskUpdate {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      due_date?: string;
      assignee_id?: string;
      assignee_role?: string;
      related_to_type?: string;
      related_to_id?: string;
      partner_id?: string;
      completed_at?: string | null;
    }

    const updateData: TaskUpdate = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.due_date = dueDate;
    if (assigneeId !== undefined) updateData.assignee_id = assigneeId;
    if (assigneeRole !== undefined) updateData.assignee_role = assigneeRole;
    if (relatedToType !== undefined) updateData.related_to_type = relatedToType;
    if (relatedToId !== undefined) updateData.related_to_id = relatedToId;
    if (partnerId !== undefined) updateData.partner_id = partnerId;
    if (completedAt !== undefined) updateData.completed_at = completedAt;

    // Set completed_at when status changes to done
    if (status === 'done' && !completedAt) {
      updateData.completed_at = new Date().toISOString();
    } else if (status !== 'done') {
      updateData.completed_at = null;
    }

    const { data, error } = await supabase
      .from('admin_tasks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json(
        { error: 'Failed to update task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task: data });
  } catch (error) {
    console.error('Task PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    if (userRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { error } = await supabase
      .from('admin_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json(
        { error: 'Failed to delete task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Task DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
