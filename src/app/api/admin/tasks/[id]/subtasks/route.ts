import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/admin/tasks/[id]/subtasks - Get all subtasks for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { id } = await params;

    const { data, error } = await supabase
      .from('admin_task_subtasks')
      .select('*')
      .eq('task_id', id)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching subtasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subtasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subtasks: data || [] });
  } catch (error) {
    console.error('Subtasks GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tasks/[id]/subtasks - Create a new subtask
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { title } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Get the highest order_index for this task
    const { data: existingSubtasks } = await supabase
      .from('admin_task_subtasks')
      .select('order_index')
      .eq('task_id', id)
      .order('order_index', { ascending: false })
      .limit(1);

    const nextOrderIndex =
      existingSubtasks && existingSubtasks.length > 0
        ? existingSubtasks[0].order_index + 1
        : 0;

    const { data, error } = await supabase
      .from('admin_task_subtasks')
      .insert({
        task_id: id,
        title: title.trim(),
        completed: false,
        order_index: nextOrderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating subtask:', error);
      return NextResponse.json(
        { error: 'Failed to create subtask' },
        { status: 500 }
      );
    }

    return NextResponse.json({ subtask: data }, { status: 201 });
  } catch (error) {
    console.error('Subtask POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
