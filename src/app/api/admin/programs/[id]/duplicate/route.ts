import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// POST /api/admin/programs/[id]/duplicate - Duplicate a program
export async function POST(
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

    // Fetch the original program
    const { data: originalProgram, error: fetchError } = await supabase
      .from('programs')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !originalProgram) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    // Create a duplicate with modified name
    const { id: _, created_at, updated_at, view_count, ...programData } = originalProgram;

    const duplicatedProgram = {
      ...programData,
      name_en: `${originalProgram.name_en} (Copy)`,
      name_cn: originalProgram.name_cn ? `${originalProgram.name_cn} (副本)` : null,
      is_active: false, // Duplicated programs start as inactive
      is_featured: false, // Duplicated programs are not featured by default
      view_count: 0,
    };

    const { data: newProgram, error: insertError } = await supabase
      .from('programs')
      .insert(duplicatedProgram)
      .select(`
        id,
        name_en,
        name_cn,
        degree_type,
        discipline,
        major,
        teaching_language,
        duration_months,
        tuition_per_year,
        tuition_currency,
        scholarship_available,
        is_featured,
        is_active,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province
        )
      `)
      .single();

    if (insertError) {
      console.error('Error duplicating program:', insertError);
      return NextResponse.json(
        { error: 'Failed to duplicate program' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      program: {
        ...newProgram,
        degree_level: newProgram?.degree_type,
        category: newProgram?.discipline,
        status: newProgram?.is_active ? 'active' : 'inactive',
      },
      message: 'Program duplicated successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error in program duplicate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
