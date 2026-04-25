import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/admin/tasks/[id]/comments - Get all comments for a task
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
      .from('admin_task_comments')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Fetch user info for each comment
    const userIds = [...new Set((data || []).map((c) => c.user_id))];
    const userMap = new Map<string, { full_name: string; email: string }>();

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', userIds);

      for (const u of users || []) {
        userMap.set(u.id, { full_name: u.full_name, email: u.email });
      }
    }

    const enrichedComments = (data || []).map((comment) => ({
      ...comment,
      user: userMap.get(comment.user_id) || null,
    }));

    return NextResponse.json({ comments: enrichedComments });
  } catch (error) {
    console.error('Comments GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tasks/[id]/comments - Create a new comment
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
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Get current user info
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    let userId: string | undefined;
    let userRole: string = 'admin';

    if (token) {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      userId = authUser?.id;
      userRole = authUser?.user_metadata?.role || 'admin';
    }

    const { data, error } = await supabase
      .from('admin_task_comments')
      .insert({
        task_id: id,
        user_id: userId,
        user_role: userRole,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Fetch user info for the response
    const { data: userInfo } = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    return NextResponse.json(
      {
        comment: {
          ...data,
          user: userInfo || null,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Comment POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
