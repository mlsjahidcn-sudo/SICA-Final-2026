import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/templates - List user's templates
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();

    const query = supabase
      .from('application_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({
      templates: templates || [],
      total: templates?.length || 0,
    });

  } catch (error) {
    console.error('Error in templates GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/student/templates - Create a new template
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, personal_statement, study_plan, is_default } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // If setting as default, unset other defaults first
    if (is_default) {
      await supabase
        .from('application_templates')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    const { data: template, error } = await supabase
      .from('application_templates')
      .insert({
        user_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        personal_statement: personal_statement || null,
        study_plan: study_plan || null,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
    }

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Error in templates POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
