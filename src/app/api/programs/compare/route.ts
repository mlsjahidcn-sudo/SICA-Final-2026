import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/programs/compare - Get comparison list for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get comparison record
    const { data: comparison, error } = await supabase
      .from('program_comparisons')
      .select('id, program_ids, created_at')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to fetch comparison list' },
        { status: 500 }
      );
    }

    // If no comparison or empty program_ids, return empty
    if (!comparison || !comparison.program_ids || comparison.program_ids.length === 0) {
      return NextResponse.json({
        comparison: null,
        programs: []
      });
    }

    // Fetch program details
    const programIds = comparison.program_ids as string[];
    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select(`
        id,
        name_en,
        name_cn,
        degree_type,
        discipline,
        major,
        teaching_language,
        duration_months,
        duration_years,
        tuition_per_year,
        tuition_currency,
        application_fee,
        scholarship_available,
        scholarship_types,
        scholarship_coverage,
        min_gpa,
        language_requirement,
        entrance_exam_required,
        rating,
        review_count,
        capacity,
        category,
        sub_category,
        cover_image,
        tags,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province,
          ranking_national,
          logo_url
        )
      `)
      .in('id', programIds)
      .eq('is_active', true);

    if (programsError) {
      return NextResponse.json(
        { error: 'Failed to fetch programs' },
        { status: 500 }
      );
    }

    // Sort programs in the same order as program_ids
    const sortedPrograms = programIds
      .map(id => programs?.find(p => p.id === id))
      .filter(Boolean);

    return NextResponse.json({
      comparison: {
        id: comparison.id,
        created_at: comparison.created_at,
        program_count: programIds.length
      },
      programs: sortedPrograms
    });
  } catch (error) {
    console.error('Error fetching comparison list:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comparison list' },
      { status: 500 }
    );
  }
}

// POST /api/programs/compare - Add program to comparison
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, program_id } = body;

    if (!user_id || !program_id) {
      return NextResponse.json(
        { error: 'user_id and program_id are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify program exists
    const { data: program } = await supabase
      .from('programs')
      .select('id')
      .eq('id', program_id)
      .eq('is_active', true)
      .single();

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Get or create comparison record
    const { data: existingComparison } = await supabase
      .from('program_comparisons')
      .select('id, program_ids')
      .eq('user_id', user_id)
      .single();

    if (existingComparison) {
      const currentIds = (existingComparison.program_ids as string[]) || [];
      
      // Check if already in comparison
      if (currentIds.includes(program_id)) {
        return NextResponse.json(
          { error: 'Program already in comparison list' },
          { status: 400 }
        );
      }

      // Check max limit (e.g., 4 programs)
      if (currentIds.length >= 4) {
        return NextResponse.json(
          { error: 'Maximum 4 programs can be compared at once' },
          { status: 400 }
        );
      }

      // Add program to comparison
      const newIds = [...currentIds, program_id];
      const { error } = await supabase
        .from('program_comparisons')
        .update({ program_ids: newIds })
        .eq('id', existingComparison.id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to add program to comparison' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        program_count: newIds.length 
      });
    }

    // Create new comparison record
    const { error } = await supabase
      .from('program_comparisons')
      .insert({
        user_id,
        program_ids: [program_id]
      });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create comparison list' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      program_count: 1 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding to comparison:', error);
    return NextResponse.json(
      { error: 'Failed to add to comparison' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/compare - Remove program from comparison
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const programId = searchParams.get('program_id');
    const clearAll = searchParams.get('clear_all') === 'true';

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    if (clearAll) {
      // Clear all comparisons
      const { error } = await supabase
        .from('program_comparisons')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to clear comparison list' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    if (!programId) {
      return NextResponse.json(
        { error: 'program_id is required (or use clear_all=true)' },
        { status: 400 }
      );
    }

    // Get current comparison
    const { data: comparison } = await supabase
      .from('program_comparisons')
      .select('id, program_ids')
      .eq('user_id', userId)
      .single();

    if (!comparison) {
      return NextResponse.json(
        { error: 'No comparison list found' },
        { status: 404 }
      );
    }

    const currentIds = (comparison.program_ids as string[]) || [];
    const newIds = currentIds.filter(id => id !== programId);

    if (newIds.length === 0) {
      // Delete the comparison record if empty
      const { error } = await supabase
        .from('program_comparisons')
        .delete()
        .eq('id', comparison.id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to remove from comparison' },
          { status: 500 }
        );
      }
    } else {
      // Update with remaining programs
      const { error } = await supabase
        .from('program_comparisons')
        .update({ program_ids: newIds })
        .eq('id', comparison.id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to remove from comparison' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from comparison:', error);
    return NextResponse.json(
      { error: 'Failed to remove from comparison' },
      { status: 500 }
    );
  }
}
