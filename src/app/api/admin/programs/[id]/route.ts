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
      degree_level: program.degree_type,
      category: program.discipline,
      sub_category: program.major,
      duration_years: program.duration_months ? program.duration_months / 12 : null,
      teaching_languages: program.teaching_language 
        ? program.teaching_language.split(',').map((l: string) => l.trim())
        : [],
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

    // Map frontend fields to database schema
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Map fields
    if (body.name_en !== undefined) updateData.name_en = body.name_en;
    if (body.name_cn !== undefined) updateData.name_cn = body.name_cn;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.degree_level !== undefined || body.degree_type !== undefined) {
      updateData.degree_type = body.degree_level || body.degree_type;
    }
    if (body.category !== undefined || body.discipline !== undefined) {
      updateData.discipline = body.category || body.discipline;
    }
    if (body.sub_category !== undefined || body.major !== undefined) {
      updateData.major = body.sub_category || body.major;
    }
    if (body.teaching_languages !== undefined) {
      updateData.teaching_language = Array.isArray(body.teaching_languages)
        ? body.teaching_languages.join(', ')
        : body.teaching_languages;
    }
    if (body.duration_years !== undefined) {
      updateData.duration_months = body.duration_years ? Math.round(body.duration_years * 12) : null;
    }
    if (body.duration_months !== undefined) updateData.duration_months = body.duration_months;
    if (body.tuition_per_year !== undefined) updateData.tuition_per_year = body.tuition_per_year;
    if (body.tuition_currency !== undefined) updateData.tuition_currency = body.tuition_currency;
    if (body.application_fee !== undefined) updateData.application_fee = body.application_fee;
    if (body.scholarship_available !== undefined) updateData.scholarship_available = body.scholarship_available;
    if (body.scholarship_details !== undefined) updateData.scholarship_details = body.scholarship_details;
    if (body.application_requirements !== undefined || body.language_requirement !== undefined) {
      updateData.entry_requirements = body.application_requirements || body.language_requirement;
    }
    if (body.application_documents !== undefined) updateData.required_documents = body.application_documents;
    if (body.is_featured !== undefined) updateData.is_featured = body.is_featured;
    if (body.status !== undefined) updateData.is_active = body.status === 'active';
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.teaching_language !== undefined) updateData.teaching_language = body.teaching_language;

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
        degree_level: program.degree_type,
        category: program.discipline,
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
