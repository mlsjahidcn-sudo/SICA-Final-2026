import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const PROGRAM_SELECT = `
  id,
  name,
  name_fr,
  code,
  university_id,
  degree_level,
  language,
  category,
  sub_category,
  description,
  description_en,
  description_cn,
  curriculum_en,
  curriculum_cn,
  career_prospects_en,
  career_prospects_cn,
  duration_years,
  start_month,
  application_start_date,
  application_end_date,
  min_gpa,
  language_requirement,
  entrance_exam_required,
  entrance_exam_details,
  prerequisites,
  tuition_fee_per_year,
  currency,
  scholarship_coverage,
  scholarship_types,
  application_requirements,
  cover_image,
  is_active,
  rating,
  review_count,
  accreditation,
  outcomes,
  tags,
  capacity,
  current_applications,
  application_fee_currency,
  accommodation_fee_currency,
  universities (
    id,
    name_en,
    name_cn,
    city,
    province,
    logo_url,
    website_url,
    type,
    ranking_national
  )
`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();

    // Try as UUID first
    const { data: program, error } = await supabase
      .from('programs')
      .select(PROGRAM_SELECT)
      .eq('id', id)
      .single();

    if (error || !program) {
      // Try as slug - but slug column doesn't exist, skip
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    return NextResponse.json(program);
  } catch (error) {
    console.error('Error in program detail GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
