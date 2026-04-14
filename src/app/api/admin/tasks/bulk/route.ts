import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// PUT /api/admin/tasks/bulk - Bulk update tasks
export async function PUT(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { taskIds, status, priority, assigneeId } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds must be a non-empty array' }, { status: 400 });
    }

    interface TaskUpdate {
      status?: string;
      priority?: string;
      assignee_id?: string;
      updated_at: string;
    }

    const updateData: TaskUpdate = {
      updated_at: new Date().toISOString(),
    };

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (assigneeId !== undefined) updateData.assignee_id = assigneeId || null;

    // Update all tasks
    const results = await Promise.all(
      taskIds.map((id: string) =>
        supabase
          .from('admin_tasks')
          .update(updateData)
          .eq('id', id)
          .select()
      )
    );

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Bulk update errors:', errors);
    }

    const updatedTasks = results.map((r) => r.data).filter(Boolean);

    return NextResponse.json({
      success: true,
      updatedCount: updatedTasks.length,
      tasks: updatedTasks,
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/tasks/bulk - Bulk delete tasks
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { taskIds } = body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ error: 'taskIds must be a non-empty array' }, { status: 400 });
    }

    const { error } = await supabase
      .from('admin_tasks')
      .delete()
      .in('id', taskIds);

    if (error) {
      console.error('Bulk delete error:', error);
      return NextResponse.json({ error: 'Failed to delete tasks' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: taskIds.length,
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
