import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/admin/programs/[id] - Get a single program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data: program, error } = await supabase
      .from('programs')
      .select(`
        *,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province
        )
      `)
      .eq('id', id)
      .single();

    if (error || !program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Transform to match frontend expectations
    const transformedProgram = {
      ...program,
      status: program.is_active ? 'active' : 'inactive',
    };

    return NextResponse.json({ program: transformedProgram });
  } catch (error) {
    console.error('Error in program GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/programs/[id] - Update a program
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    // Check if program exists
    const { data: existing, error: fetchError } = await supabase
      .from('programs')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Map frontend fields to actual database schema
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map fields to actual columns
    if (body.name !== undefined) updateData.name = body.name;
    if (body.name_fr !== undefined) updateData.name_fr = body.name_fr;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.description_en !== undefined) updateData.description_en = body.description_en;
    if (body.description_cn !== undefined) updateData.description_cn = body.description_cn;
    if (body.degree_level !== undefined) updateData.degree_level = body.degree_level;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.sub_category !== undefined) updateData.sub_category = body.sub_category;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.duration_years !== undefined) updateData.duration_years = body.duration_years;
    if (body.tuition_fee_per_year !== undefined) updateData.tuition_fee_per_year = body.tuition_fee_per_year;
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.scholarship_available !== undefined) updateData.scholarship_available = body.scholarship_available;
    if (body.scholarship_types !== undefined) updateData.scholarship_types = body.scholarship_types;
    if (body.application_fee !== undefined) updateData.application_fee = body.application_fee;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.status !== undefined) updateData.is_active = body.status === 'active';
    if (body.tags !== undefined) updateData.tags = body.tags;
    // Legacy field mappings for backward compatibility
    if (body.name_en !== undefined && !body.name) updateData.name = body.name_en;
    if (body.teaching_language !== undefined && !body.language) updateData.language = body.teaching_language;
    if (body.tuition_per_year !== undefined && !body.tuition_fee_per_year) updateData.tuition_fee_per_year = body.tuition_per_year;
    if (body.tuition_currency !== undefined && !body.currency) updateData.currency = body.tuition_currency;

    const { data: program, error } = await supabase
      .from('programs')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province
        )
      `)
      .single();

    if (error) {
      console.error('Error updating program:', error);
      return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
    }

    return NextResponse.json({ 
      program: {
        ...program,
        status: program.is_active ? 'active' : 'inactive'
      }
    });
  } catch (error) {
    console.error('Error in program PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/programs/[id] - Soft delete (archive) a program
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('programs')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error archiving program:', error);
      return NextResponse.json({ error: 'Failed to archive program' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Program archived' });
  } catch (error) {
    console.error('Error in program DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
