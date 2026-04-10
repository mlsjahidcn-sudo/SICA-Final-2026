import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');

    if (!ids) {
      return NextResponse.json({ error: 'Please provide program IDs as comma-separated values' }, { status: 400 });
    }

    const programIds = ids.split(',').filter(Boolean);
    if (programIds.length < 2) {
      return NextResponse.json({ error: 'Please provide at least 2 program IDs for comparison' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data: programs, error: programsError } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        degree_level,
        language,
        duration_years,
        tuition_fee_per_year,
        currency,
        application_fee_currency,
        scholarship_coverage,
        scholarship_types,
        min_gpa,
        language_requirement,
        entrance_exam_required,
        category,
        sub_category,
        rating,
        review_count,
        capacity,
        current_applications,
        tags,
        cover_image,
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
      .in('id', programIds);

    if (programsError) {
      console.error('Error fetching programs for comparison:', programsError);
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
    }

    return NextResponse.json({ programs: programs || [] });
  } catch (error) {
    console.error('Error in programs compare:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
