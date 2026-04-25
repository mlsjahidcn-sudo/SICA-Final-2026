import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UniversityDetailContent } from '@/components/university-detail-content';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { UniversitySchema, BreadcrumbSchema } from '@/components/seo/json-ld';

const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';

// Helper to check if string is a UUID
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const supabase = getSupabaseClient();
  
  // Query by slug or id
  const query = isUUID(id) 
    ? supabase.from('universities').select('id, slug, name_en, name_cn, city, province, description, meta_title, meta_description, og_image').eq('id', id).single()
    : supabase.from('universities').select('id, slug, name_en, name_cn, city, province, description, meta_title, meta_description, og_image').eq('slug', id).single();
  
  const { data: university } = await query;

  if (!university) {
    return {
      title: 'University Not Found',
    };
  }

  // Use slug for URL if available, otherwise use id
  const urlSlug = university.slug || university.id;
  
  // Use custom OG image if available, otherwise use dynamic generated image
  const ogImageUrl = university.og_image || `${baseUrl}/api/og/universities/${urlSlug}`;

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
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
      type: 'website',
      url: `${baseUrl}/universities/${urlSlug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: university.meta_title || `${university.name_en} - Study in China`,
      description: university.meta_description || university.description || `Study at ${university.name_en} in ${university.city}, ${university.province}`,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `${baseUrl}/universities/${urlSlug}`,
    },
  };
}

export default async function UniversityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseClient();
  
  // Query by slug or id
  const query = isUUID(id) 
    ? supabase.from('universities').select('id, slug, name_en, name_cn, city, province, description, website_url, logo_url').eq('id', id).single()
    : supabase.from('universities').select('id, slug, name_en, name_cn, city, province, description, website_url, logo_url').eq('slug', id).single();
  
  const { data: university } = await query;

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

  const urlSlug = university.slug || university.id;
  
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Universities', url: '/universities' },
    { name: university.name_en, url: `/universities/${urlSlug}` },
  ];

  return (
    <>
      {/* Structured Data for SEO */}
      <UniversitySchema university={universitySchemaData} />
      <BreadcrumbSchema items={breadcrumbItems} />
      <UniversityDetailContent universityId={university.id} />
    </>
  );
}
