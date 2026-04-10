import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UniversityDetailContent } from '@/components/university-detail-content';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { UniversitySchema, BreadcrumbSchema } from '@/components/seo/json-ld';

const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
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
    title: university.meta_title || `${university.name_en} - Study in China`,
    description: university.meta_description || university.description || `Study at ${university.name_en} (${university.name_cn}) in ${university.city}, ${university.province}. Discover programs, scholarships, and admission requirements.`,
    keywords: [
      university.name_en,
      university.name_cn || '',
      'chinese university',
      'study in china',
      university.city,
      university.province,
    ].filter(Boolean),
    openGraph: {
      title: university.meta_title || `${university.name_en} - Study in China`,
      description: university.meta_description || university.description || `Study at ${university.name_en} in ${university.city}, ${university.province}`,
      images: university.og_image ? [{ url: university.og_image, width: 1200, height: 630 }] : [],
      type: 'website',
      url: `${baseUrl}/universities/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: university.meta_title || `${university.name_en} - Study in China`,
      description: university.meta_description || university.description || `Study at ${university.name_en} in ${university.city}, ${university.province}`,
      images: university.og_image ? [university.og_image] : [],
    },
    alternates: {
      canonical: `${baseUrl}/universities/${id}`,
    },
  };
}

export default async function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  
  const { data: university } = await supabase
    .from('universities')
    .select('id, name_en, name_cn, city, province, description, website_url, logo_url')
    .eq('id', id)
    .single();

  if (!university) {
    notFound();
  }

  // Prepare structured data
  const universitySchemaData = {
    name_en: university.name_en,
    name_cn: university.name_cn,
    city: university.city,
    province: university.province,
    description: university.description,
    website_url: university.website_url,
    logo_url: university.logo_url,
  };

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Universities', url: '/universities' },
    { name: university.name_en, url: `/universities/${id}` },
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <UniversitySchema university={universitySchemaData} />
      <BreadcrumbSchema items={breadcrumbItems} />
      <UniversityDetailContent universityId={id} />
    </>
  );
}
