import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { apiCache, CACHE_TTL, withTimeout } from '@/lib/api-cache';

// Types
interface Partner {
  id: string;
  name_en: string;
  name_cn: string | null;
  logo_url: string | null;
  logo_alt: string | null;
  partner_type: string;
  category: string | null;
  website_url: string | null;
  description_en: string | null;
  description_cn: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  partnership_level: string;
  partnership_since: string | null;
  students_referred: number;
  success_rate: number | null;
  is_featured: boolean;
  display_order: number;
}

// GET /api/partners - Get active partners (with caching)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Generate cache key
    const cacheKey = `partners:${locale}:${type || 'all'}:${featured || 'all'}:${limit}`;
    
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = getSupabaseClient();

    let query = supabase
      .from('partner_showcases')
      .select('*')
      .eq('status', 'active')
      .order('display_order', { ascending: true })
      .order('name_en', { ascending: true });

    if (type) {
      query = query.eq('partner_type', type);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    if (limit > 0) {
      query = query.limit(limit);
    }

    // Add timeout to database query
    const { data: partners, error } = await withTimeout(
      query,
      5000,
      'Partners query timed out'
    );

    if (error) {
      console.error('Error fetching partners:', error);
      return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 });
    }

    // Transform the data
    const transformedPartners = (partners as unknown as Partner[])?.map(p => ({
      id: p.id,
      name: locale === 'cn' ? (p.name_cn || p.name_en) : p.name_en,
      logo: p.logo_url,
      logoAlt: p.logo_alt || p.name_en,
      type: p.partner_type,
      category: p.category,
      website: p.website_url,
      description: locale === 'cn' ? (p.description_cn || p.description_en) : p.description_en,
      country: p.country,
      countryCode: p.country_code,
      city: p.city,
      partnershipLevel: p.partnership_level,
      partnershipSince: p.partnership_since,
      studentsReferred: p.students_referred,
      successRate: p.success_rate,
      isFeatured: p.is_featured,
    })) || [];

    // Group by type
    const partnersByType = transformedPartners.reduce((acc, partner) => {
      const type = partner.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(partner);
      return acc;
    }, {} as Record<string, typeof transformedPartners>);

    const response = {
      partners: transformedPartners,
      partnersByType,
      total: transformedPartners.length,
    };

    // Cache the response for 5 minutes
    apiCache.set(cacheKey, response, CACHE_TTL.LONG);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in partners API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
