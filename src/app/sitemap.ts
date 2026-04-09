import { MetadataRoute } from 'next';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface University {
  id: string;
  name_en: string;
  updated_at: string | null;
}

interface Program {
  id: string;
  name_en: string;
  updated_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.COE_PROJECT_DOMAIN_DEFAULT 
    ? `https://${process.env.COE_PROJECT_DOMAIN_DEFAULT}` 
    : 'http://localhost:5000';

  const staticRoutes = [
    '',
    '/about',
    '/universities',
    '/programs',
    '/faq',
    '/contact',
    '/apply',
    '/terms',
    '/privacy',
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Fetch universities
  const supabase = getSupabaseClient();
  const { data: universities } = await supabase
    .from('universities')
    .select('id, name_en, updated_at')
    .eq('is_active', true);

  const universityEntries: MetadataRoute.Sitemap = (universities || []).map((uni: University) => ({
    url: `${baseUrl}/universities/${uni.id}`,
    lastModified: uni.updated_at ? new Date(uni.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  // Fetch programs
  const { data: programs } = await supabase
    .from('programs')
    .select('id, name_en, updated_at')
    .eq('is_active', true);

  const programEntries: MetadataRoute.Sitemap = (programs || []).map((prog: Program) => ({
    url: `${baseUrl}/programs/${prog.id}`,
    lastModified: prog.updated_at ? new Date(prog.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [...staticEntries, ...universityEntries, ...programEntries];
}
