import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// PUT /api/admin/tasks/[id]/subtasks/reorder - Reorder subtasks
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const { id } = await params;
    const body = await request.json();
    const { subtaskIds } = body;

    if (!Array.isArray(subtaskIds)) {
      return NextResponse.json(
        { error: 'subtaskIds must be an array' },
        { status: 400 }
      );
    }

    // Update order_index for each subtask
    const updates = subtaskIds.map((subtaskId: string, index: number) => ({
      id: subtaskId,
      order_index: index,
    }));

    // Use transaction-like approach with individual updates
    const results = await Promise.all(
      updates.map((update) =>
        supabase
          .from('admin_task_subtasks')
          .update({ order_index: update.order_index })
          .eq('id', update.id)
          .eq('task_id', id)
      )
    );

    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.error('Errors reordering subtasks:', errors);
      return NextResponse.json(
        { error: 'Failed to reorder some subtasks' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Subtasks reorder error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
