import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// PATCH /api/admin/tasks/[id]/subtasks/[subtaskId] - Update a subtask
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { id, subtaskId } = await params;
    const body = await request.json();

    interface SubtaskUpdate {
      title?: string;
      completed?: boolean;
      order_index?: number;
    }

    const updateData: SubtaskUpdate = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.completed !== undefined) updateData.completed = body.completed;
    if (body.order_index !== undefined) updateData.order_index = body.order_index;

    const { data, error } = await supabase
      .from('admin_task_subtasks')
      .update(updateData)
      .eq('id', subtaskId)
      .eq('task_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating subtask:', error);
      return NextResponse.json(
        { error: 'Failed to update subtask' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Subtask not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ subtask: data });
  } catch (error) {
    console.error('Subtask PATCH error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tasks/[id]/subtasks/[subtaskId] - Delete a subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { id, subtaskId } = await params;

    const { error } = await supabase
      .from('admin_task_subtasks')
      .delete()
      .eq('id', subtaskId)
      .eq('task_id', id);

    if (error) {
      console.error('Error deleting subtask:', error);
      return NextResponse.json(
        { error: 'Failed to delete subtask' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subtask DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
