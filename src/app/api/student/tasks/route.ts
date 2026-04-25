import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/tasks - Get student's tasks
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const applicationId = searchParams.get('applicationId');

    // Get student record id (applications.student_id references students.id)
    const { data: studentRecord } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const studentId = studentRecord?.id;

    // Build query - students see tasks assigned to them OR related to their applications
    let query = supabase
      .from('admin_tasks')
      .select('*')
      .or(`assignee_id.eq.${user.id},related_to_type.eq.application`);

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (applicationId) {
      query = query.eq('related_to_id', applicationId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching student tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks' },
        { status: 500 }
      );
    }

    // Filter to only include tasks related to this student's applications
    // First get the student's application IDs
    const { data: studentApps } = studentId
      ? await supabase
          .from('applications')
          .select('id')
          .eq('student_id', studentId)
      : { data: [] };

    const applicationIds = (studentApps || []).map((a) => a.id);

    // Filter tasks
    const filteredTasks = (data || []).filter((task) => {
      // Include if assigned to student
      if (task.assignee_id === user.id) return true;
      // Include if related to student's application
      if (
        task.related_to_type === 'application' &&
        applicationIds.includes(task.related_to_id)
      ) {
        return true;
      }
      return false;
    });

    // Fetch creator info
    const userIds = new Set<string>();
    for (const task of filteredTasks) {
      if (task.creator_id) userIds.add(task.creator_id);
      if (task.assignee_id) userIds.add(task.assignee_id);
    }

    const userMap = new Map<string, { full_name: string; email: string }>();
    if (userIds.size > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', Array.from(userIds));

      for (const u of users || []) {
        userMap.set(u.id, { full_name: u.full_name, email: u.email });
      }
    }

    const enrichedTasks = filteredTasks.map((task) => ({
      ...task,
      creator: task.creator_id ? userMap.get(task.creator_id) || null : null,
      assignee: task.assignee_id
        ? userMap.get(task.assignee_id) || null
        : null,
    }));

    return NextResponse.json({ tasks: enrichedTasks });
  } catch (error) {
    console.error('Student tasks GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/student/tasks - Student creates a personal task
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const {
      title,
      description,
      priority,
      due_date,
      related_to_type,
      related_to_id,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
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
        creator_role: 'student',
        assignee_id: user.id,
        assignee_role: 'student',
        related_to_type: related_to_type || null,
        related_to_id: related_to_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task' },
        { status: 500 }
      );
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Student task POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
