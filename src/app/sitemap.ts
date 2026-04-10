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

interface BlogPost {
  slug: string;
  updated_at: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';

  const staticRoutes = [
    { path: '', priority: 1, changeFreq: 'daily' as const },
    { path: '/about', priority: 0.8, changeFreq: 'monthly' as const },
    { path: '/universities', priority: 0.9, changeFreq: 'weekly' as const },
    { path: '/programs', priority: 0.9, changeFreq: 'weekly' as const },
    { path: '/blog', priority: 0.8, changeFreq: 'daily' as const },
    { path: '/faq', priority: 0.6, changeFreq: 'monthly' as const },
    { path: '/contact', priority: 0.5, changeFreq: 'monthly' as const },
    { path: '/apply', priority: 0.7, changeFreq: 'monthly' as const },
    { path: '/terms', priority: 0.3, changeFreq: 'yearly' as const },
    { path: '/privacy', priority: 0.3, changeFreq: 'yearly' as const },
    { path: '/partners', priority: 0.6, changeFreq: 'monthly' as const },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFreq,
    priority: route.priority,
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

  // Fetch published blog posts
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published');

  const blogEntries: MetadataRoute.Sitemap = (blogPosts || []).map((post: BlogPost) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...universityEntries, ...programEntries, ...blogEntries];
}
