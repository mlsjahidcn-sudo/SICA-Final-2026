import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'en'; // Support language parameter
    const userId = searchParams.get('user_id'); // For favorite/check status

    // Fetch program with university details and new fields
    const { data: program, error } = await supabase
      .from('programs')
      .select(`
        id,
        name_en,
        name_cn,
        name_fr,
        slug,
        degree_type,
        discipline,
        major,
        code,
        category,
        sub_category,
        teaching_language,
        duration_months,
        duration_years,
        duration_description,
        start_month,
        tuition_per_year,
        tuition_currency,
        application_fee,
        application_fee_currency,
        accommodation_fee_per_year,
        accommodation_fee_currency,
        scholarship_available,
        scholarship_details,
        scholarship_types,
        scholarship_coverage,
        entry_requirements,
        required_documents,
        intake_months,
        application_start_date,
        application_end_date,
        application_deadline_fall,
        application_deadline_spring,
        application_requirements,
        description,
        description_en,
        description_cn,
        curriculum,
        curriculum_en,
        curriculum_cn,
        career_prospects,
        career_prospects_en,
        career_prospects_cn,
        min_gpa,
        language_requirement,
        entrance_exam_required,
        entrance_exam_details,
        prerequisites,
        capacity,
        current_applications,
        cover_image,
        tags,
        is_featured,
        is_popular,
        is_active,
        view_count,
        rating,
        review_count,
        risk_level,
        accreditation,
        outcomes,
        created_at,
        updated_at,
        universities (
          id,
          name_en,
          name_cn,
          city,
          province,
          ranking_national,
          ranking_international,
          student_count,
          international_student_count,
          website,
          logo_url,
          cover_image_url,
          type,
          description
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error || !program) {
      return NextResponse.json(
        { error: 'Program not found' },
        { status: 404 }
      );
    }

    // Fetch translations if language is not 'en'
    let translations = null;
    if (language !== 'en') {
      const { data: translationData } = await supabase
        .from('program_translations')
        .select('*')
        .eq('program_id', id)
        .eq('language', language)
        .single();
      translations = translationData;
    }

    // Fetch related programs (same university or same discipline)
    const universityData = Array.isArray(program.universities) 
      ? program.universities[0] 
      : program.universities;
    const universityId = universityData?.id;
    const { data: relatedPrograms } = await supabase
      .from('programs')
      .select(`
        id,
        name_en,
        name_cn,
        degree_type,
        tuition_per_year,
        tuition_currency,
        duration_months,
        scholarship_available,
        rating,
        review_count,
        universities (
          id,
          name_en,
          city,
          logo_url
        )
      `)
      .eq('is_active', true)
      .eq('university_id', universityId)
      .neq('id', id)
      .limit(4);

    // Check if user has favorited this program
    let isFavorited = false;
    if (userId) {
      const { data: favorite } = await supabase
        .from('program_favorites')
        .select('id')
        .eq('program_id', id)
        .eq('user_id', userId)
        .single();
      isFavorited = !!favorite;
    }

    // Increment view count
    await supabase
      .from('programs')
      .update({ view_count: (program.view_count || 0) + 1 })
      .eq('id', id);

    // Get review statistics
    const { data: reviewStats } = await supabase
      .from('program_reviews')
      .select('rating')
      .eq('program_id', id)
      .eq('is_published', true);

    const reviewDistribution = {
      5: reviewStats?.filter(r => r.rating === 5).length || 0,
      4: reviewStats?.filter(r => r.rating === 4).length || 0,
      3: reviewStats?.filter(r => r.rating === 3).length || 0,
      2: reviewStats?.filter(r => r.rating === 2).length || 0,
      1: reviewStats?.filter(r => r.rating === 1).length || 0,
    };

    return NextResponse.json({ 
      program,
      translations,
      relatedPrograms: relatedPrograms || [],
      userStatus: {
        is_favorited: isFavorited
      },
      reviewStats: {
        total: reviewStats?.length || 0,
        average: program.rating,
        distribution: reviewDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching program:', error);
    return NextResponse.json(
      { error: 'Failed to fetch program' },
      { status: 500 }
    );
  }
}
