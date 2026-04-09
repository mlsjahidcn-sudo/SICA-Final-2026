import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

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

// GET /api/partners - Get active partners
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'en';
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    const { data: partners, error } = await query;

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

    return NextResponse.json({
      partners: transformedPartners,
      partnersByType,
      total: transformedPartners.length,
    });
  } catch (error) {
    console.error('Error in partners API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
