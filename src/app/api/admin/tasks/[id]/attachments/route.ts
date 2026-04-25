import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/admin/tasks/[id]/attachments - Get all attachments for a task
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
      .from('admin_task_attachments')
      .select('*')
      .eq('task_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching attachments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attachments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachments: data || [] });
  } catch (error) {
    console.error('Attachments GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tasks/[id]/attachments - Create attachment record
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
    const { fileName, fileKey, fileSize, contentType } = body;

    if (!fileName || !fileKey) {
      return NextResponse.json(
        { error: 'fileName and fileKey are required' },
        { status: 400 }
      );
    }

    // Get current user
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    let userId: string | undefined;

    if (token) {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      userId = authUser?.id;
    }

    const { data, error } = await supabase
      .from('admin_task_attachments')
      .insert({
        task_id: id,
        file_name: fileName,
        file_key: fileKey,
        file_size: fileSize || null,
        content_type: contentType || null,
        uploaded_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating attachment:', error);
      return NextResponse.json(
        { error: 'Failed to create attachment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachment: data }, { status: 201 });
  } catch (error) {
    console.error('Attachment POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
