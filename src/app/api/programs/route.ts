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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const university_id = searchParams.get('university_id');
    const search = searchParams.get('search');
    const degree_level = searchParams.get('degree_level') || searchParams.get('degree_type');
    const language = searchParams.get('language');
    const category = searchParams.get('category') || searchParams.get('discipline');
    const sub_category = searchParams.get('sub_category');
    const scholarship = searchParams.get('scholarship');

    const offset = (page - 1) * limit;

    const supabase = getSupabaseClient();
    let query = supabase
      .from('programs')
      .select(PROGRAM_SELECT, { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (university_id) {
      query = query.eq('university_id', university_id);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,description_en.ilike.%${search}%`);
    }

    if (degree_level) {
      const degrees = degree_level.split(',').map(d => d.trim());
      query = query.in('degree_level', degrees);
    }

    if (language) {
      const languages = language.split(',').map(l => l.trim());
      query = query.in('language', languages);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (sub_category) {
      query = query.eq('sub_category', sub_category);
    }

    if (scholarship === 'true') {
      query = query.not('scholarship_coverage', 'is', null);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: programs, error, count } = await query;

    if (error) {
      console.error('Error fetching programs:', error);
      return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 });
    }

    return NextResponse.json({
      programs: programs || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      hasMore: (count || 0) > page * limit
    });
  } catch (error) {
    console.error('Error in programs GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
