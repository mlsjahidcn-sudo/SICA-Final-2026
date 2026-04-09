import { notFound } from 'next/navigation';
import { UniversityDetailContent } from '@/components/university-detail-content';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  
  const { data: university } = await supabase
    .from('universities')
    .select('id, name_en, name_cn, city, province, description, meta_title, meta_description, og_image')
    .eq('id', id)
    .single();

  if (!university) {
    return {
      title: 'University Not Found',
    };
  }

  return {
    title: university.meta_title || `${university.name_en} | Study In China Academy`,
    description: university.meta_description || university.description || `Study at ${university.name_en} in ${university.city}, ${university.province}`,
    openGraph: {
      title: university.meta_title || `${university.name_en} | Study In China Academy`,
      description: university.meta_description || university.description || `Study at ${university.name_en} in ${university.city}, ${university.province}`,
      images: university.og_image ? [university.og_image] : [],
      type: 'website',
    },
  };
}

export default async function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  
  const { data: university } = await supabase
    .from('universities')
    .select('id')
    .eq('id', id)
    .single();

  if (!university) {
    notFound();
  }

  return <UniversityDetailContent universityId={id} />;
}
