import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { apiCache, CACHE_TTL, withTimeout } from '@/lib/api-cache';

// Types
interface Testimonial {
  id: string;
  user_name_en: string;
  user_name_cn: string | null;
  user_avatar_url: string | null;
  user_country: string | null;
  user_country_code: string | null;
  user_role_en: string | null;
  user_role_cn: string | null;
  university_name_en: string | null;
  university_name_cn: string | null;
  program_name_en: string | null;
  program_name_cn: string | null;
  content_en: string;
  content_cn: string | null;
  rating: number;
  video_url: string | null;
  image_url: string | null;
  status: string;
  is_featured: boolean;
  display_order: number;
  source: string;
  created_at: string;
}

// GET /api/testimonials - Get approved testimonials (with caching)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '10');

    // Generate cache key
    const cacheKey = `testimonials:${locale}:${featured || 'all'}:${limit}`;
    
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('testimonials')
      .select('*')
      .in('status', ['approved', 'featured'])
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    // Add timeout to database query
    const { data: testimonials, error } = await withTimeout(
      query,
      5000,
      'Testimonials query timed out'
    );

    if (error) {
      // If table doesn't exist, return empty array gracefully
      if (error.code === 'PGRST205' || error.message?.includes('Could not find')) {
        console.warn('Testimonials table not found, returning empty array');
        return NextResponse.json({ testimonials: [], total: 0 });
      }
      console.error('Error fetching testimonials:', error);
      return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
    }

    // Transform the data
    const transformedTestimonials = (testimonials as unknown as Testimonial[])?.map(t => ({
      id: t.id,
      userName: locale === 'cn' ? (t.user_name_cn || t.user_name_en) : t.user_name_en,
      userAvatar: t.user_avatar_url,
      userCountry: t.user_country,
      userCountryCode: t.user_country_code,
      userRole: locale === 'cn' ? (t.user_role_cn || t.user_role_en) : t.user_role_en,
      university: locale === 'cn' ? (t.university_name_cn || t.university_name_en) : t.university_name_en,
      program: locale === 'cn' ? (t.program_name_cn || t.program_name_en) : t.program_name_en,
      content: locale === 'cn' ? (t.content_cn || t.content_en) : t.content_en,
      rating: t.rating,
      videoUrl: t.video_url,
      imageUrl: t.image_url,
      isFeatured: t.is_featured,
      source: t.source,
      createdAt: t.created_at,
    })) || [];

    const response = {
      testimonials: transformedTestimonials,
      total: transformedTestimonials.length,
    };

    // Cache the response for 5 minutes
    apiCache.set(cacheKey, response, CACHE_TTL.LONG);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in testimonials API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
