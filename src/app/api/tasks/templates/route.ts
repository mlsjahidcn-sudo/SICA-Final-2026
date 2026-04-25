import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// GET /api/tasks/templates - Get all task templates
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('task_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: data || [] });
  } catch (error) {
    console.error('Templates GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tasks/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const supabase = getSupabaseClient();
    const body = await request.json();
    const { name, description, category, subtasks, is_public } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.split(' ')[1];
    let userId: string | undefined;

    if (token) {
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      userId = authUser?.id;
    }

    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'general',
        subtasks: subtasks || [],
        is_public: is_public ?? false,
        created_by: userId || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template: data }, { status: 201 });
  } catch (error) {
    console.error('Template POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
