import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

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
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/testimonials - Get all testimonials for admin
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('testimonials')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`user_name_en.ilike.${searchTerm},user_name_cn.ilike.${searchTerm},content_en.ilike.${searchTerm},content_cn.ilike.${searchTerm}`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: testimonials, error, count } = await query;

    if (error) {
      console.error('Error fetching testimonials:', error);
      return NextResponse.json({ error: 'Failed to fetch testimonials' }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabase
      .from('testimonials')
      .select('status');

    const statusCounts = (stats || []).reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      testimonials: testimonials || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats: {
        total: stats?.length || 0,
        pending: statusCounts['pending'] || 0,
        approved: statusCounts['approved'] || 0,
        featured: statusCounts['featured'] || 0,
        rejected: statusCounts['rejected'] || 0,
      },
    });
  } catch (error) {
    console.error('Error in admin testimonials API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/testimonials - Create a new testimonial
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const {
      user_name_en,
      user_name_cn,
      user_avatar_url,
      user_country,
      user_country_code,
      user_role_en,
      user_role_cn,
      university_name_en,
      university_name_cn,
      program_name_en,
      program_name_cn,
      content_en,
      content_cn,
      rating = 5,
      video_url,
      image_url,
      status = 'pending',
      is_featured = false,
      display_order = 0,
      source = 'manual',
    } = body;

    if (!user_name_en || !content_en) {
      return NextResponse.json(
        { error: 'User name (English) and content (English) are required' },
        { status: 400 }
      );
    }

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .insert({
        user_name_en,
        user_name_cn,
        user_avatar_url,
        user_country,
        user_country_code,
        user_role_en,
        user_role_cn,
        university_name_en,
        university_name_cn,
        program_name_en,
        program_name_cn,
        content_en,
        content_cn,
        rating,
        video_url,
        image_url,
        status,
        is_featured,
        display_order,
        source,
        reviewed_at: status !== 'pending' ? new Date().toISOString() : null,
        reviewed_by: status !== 'pending' ? adminCheck.id : null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating testimonial:', error);
      return NextResponse.json({ error: 'Failed to create testimonial' }, { status: 500 });
    }

    return NextResponse.json({ testimonial });
  } catch (error) {
    console.error('Error in create testimonial API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
