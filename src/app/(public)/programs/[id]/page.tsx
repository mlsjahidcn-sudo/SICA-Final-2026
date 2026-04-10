import { notFound } from 'next/navigation';
import { ProgramDetailContent } from '@/components/program-detail-content';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// UUID regex pattern for checking
// Hot reload trigger: 2025-07-28
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getProgramByIdOrSlug(idOrSlug: string) {
  const supabase = getSupabaseClient();

  // First try as id if it matches UUID pattern
  if (UUID_REGEX.test(idOrSlug)) {
    const { data: programById } = await supabase
      .from('programs')
      .select(`
        id,
        name,
        name_fr,
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
        code,
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
      `)
      .eq('id', idOrSlug)
      .single();
    if (programById) return programById;
  }

  // Try as slug
  const { data: programBySlug } = await supabase
    .from('programs')
    .select(`
      id,
      name,
      name_fr,
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
      code,
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
    `)
    .eq('slug', idOrSlug)
    .single();

  return programBySlug;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await getProgramByIdOrSlug(id);

  if (!program) {
    return { title: 'Program Not Found' };
  }

  const universityData = Array.isArray(program.universities) 
    ? program.universities[0] 
    : program.universities;
  
  const degreeLabel = program.degree_level || '';
  const uniName = universityData?.name_en || 'University';
  const uniCity = universityData?.city || '';
  
  return {
    title: `${program.name} - ${degreeLabel} | ${uniName}`,
    description: program.description_en?.slice(0, 160) || program.description?.slice(0, 160) || `Study ${program.name} at ${uniName} in ${uniCity}. ${degreeLabel} program.`,
    openGraph: {
      title: `${program.name} at ${uniName}`,
      description: program.description_en?.slice(0, 160) || program.description?.slice(0, 160),
      type: 'article',
    },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const program = await getProgramByIdOrSlug(id);

  if (!program) {
    notFound();
  }

  // Supabase may return universities as array or object depending on schema
  const rawUni = program.universities;
  const universityObj = Array.isArray(rawUni) ? rawUni[0] : rawUni;
  
  // Normalize the program data for the component
  const normalizedProgram = {
    ...program,
    universities: universityObj || undefined,
  };

  return <ProgramDetailContent program={normalizedProgram} />;
}
