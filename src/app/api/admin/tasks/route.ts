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
    if (userRole !== 'admin') {
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
    const assigneeId = searchParams.get('assigneeId');
    const relatedToType = searchParams.get('relatedToType');
    const relatedToId = searchParams.get('relatedToId');

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
    if (relatedToType && relatedToId) {
      query = query.eq('related_to_type', relatedToType).eq('related_to_id', relatedToId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ tasks: data || [] });
  } catch (error) {
    console.error('Tasks GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
      status = 'todo',
      priority = 'medium',
      dueDate,
      assigneeId,
      assigneeRole,
      relatedToType,
      relatedToId,
      partnerId,
      subtasks = []
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Create main task
    const { data: taskData, error: taskError } = await supabase
      .from('admin_tasks')
      .insert({
        title,
        description,
        status,
        priority,
        due_date: dueDate,
        assignee_id: assigneeId,
        assignee_role: assigneeRole,
        creator_id: user.id,
        creator_role: 'admin',
        related_to_type: relatedToType,
        related_to_id: relatedToId,
        partner_id: partnerId,
      })
      .select()
      .single();

    if (taskError) {
      console.error('Error creating task:', taskError);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    // Create subtasks if provided
    if (subtasks.length > 0) {
      const subtaskInserts = subtasks.map((subtask: string, index: number) => ({
        task_id: taskData.id,
        title: subtask,
        order_index: index,
      }));

      const { error: subtaskError } = await supabase
        .from('admin_task_subtasks')
        .insert(subtaskInserts);

      if (subtaskError) {
        console.error('Error creating subtasks:', subtaskError);
        // Continue even if subtasks fail
      }
    }

    return NextResponse.json({ task: taskData }, { status: 201 });
  } catch (error) {
    console.error('Tasks POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
