import { notFound } from 'next/navigation';
import { ProgramDetailContent } from '@/components/program-detail-content';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  
  const { data: program } = await supabase
    .from('programs')
    .select(`
      id, name_en, name_cn, description, degree_type, major, discipline,
      meta_title, meta_description, og_image,
      universities ( id, name_en, city, province )
    `)
    .eq('id', id)
    .single();

  if (!program) {
    return {
      title: 'Program Not Found',
    };
  }

  const university = Array.isArray(program.universities) 
    ? program.universities[0] 
    : program.universities;
  
  const degreeLabel = program.degree_type?.charAt(0).toUpperCase() + program.degree_type?.slice(1) || '';
  const majorLabel = program.major || '';
  
  return {
    title: program.meta_title || `${program.name_en} - ${degreeLabel} ${majorLabel ? `in ${majorLabel}` : ''} | ${university?.name_en}`,
    description: program.meta_description || program.description?.slice(0, 160) || `Study ${program.name_en} at ${university?.name_en} in ${university?.city}, ${university?.province}. ${degreeLabel} program in ${program.discipline || 'various fields'}.`,
    openGraph: {
      title: program.meta_title || `${program.name_en} at ${university?.name_en}`,
      description: program.meta_description || program.description?.slice(0, 160),
      images: program.og_image ? [program.og_image] : [],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: program.meta_title || `${program.name_en} at ${university?.name_en}`,
      description: program.meta_description || program.description?.slice(0, 160),
    },
  };
}

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  
  // Quick check if program exists
  const { data: program } = await supabase
    .from('programs')
    .select('id')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (!program) {
    notFound();
  }

  return <ProgramDetailContent programId={id} />;
}
