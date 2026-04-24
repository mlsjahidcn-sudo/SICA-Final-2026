import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/templates/[id] - Get template details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: template, error } = await supabase
      .from('application_templates')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Error in template GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/student/templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Check if template exists and belongs to user
    const { data: existing } = await supabase
      .from('application_templates')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Only update provided fields
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description?.trim() || null;
    if (body.personal_statement !== undefined) updateData.personal_statement = body.personal_statement || null;
    if (body.study_plan !== undefined) updateData.study_plan = body.study_plan || null;
    if (body.is_default !== undefined) {
      // If setting as default, unset other defaults first
      if (body.is_default) {
        await supabase
          .from('application_templates')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('is_default', true);
      }
      updateData.is_default = body.is_default;
    }

    const { data: template, error } = await supabase
      .from('application_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ template });

  } catch (error) {
    console.error('Error in template PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/student/templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Check if template exists and belongs to user
    const { data: existing } = await supabase
      .from('application_templates')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('application_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Template deleted' });

  } catch (error) {
    console.error('Error in template DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/student/templates/[id] - Increment use count
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Increment use count
    const { error } = await supabase.rpc('increment_template_use_count', {
      template_id: id,
      user_id_param: user.id,
    });

    // If RPC doesn't exist, do manual update
    if (error) {
      const { data: template } = await supabase
        .from('application_templates')
        .select('use_count')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (template) {
        await supabase
          .from('application_templates')
          .update({ use_count: (template.use_count || 0) + 1 })
          .eq('id', id);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in template PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
