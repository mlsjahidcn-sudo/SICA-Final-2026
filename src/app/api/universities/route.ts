import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { apiCache, CACHE_TTL, withTimeout } from '@/lib/api-cache';

// GET /api/universities - Get universities list (with caching)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const province = searchParams.get('province');
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const scholarship = searchParams.get('scholarship');
    const english = searchParams.get('english');
    const featured = searchParams.get('featured') === 'true';

    // Generate cache key for this query
    const cacheKey = `universities:${limit}:${page}:${search || 'none'}:${province || 'all'}:${type || 'all'}:${category || 'all'}:${scholarship || 'all'}:${english || 'all'}:${featured || 'false'}`;
    
    // Check cache first
    const cached = apiCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = getSupabaseClient();

    // For featured universities, get top-ranked universities
    if (featured) {
      const featuredQuery = supabase
        .from('universities')
        .select(`
          id,
          name_en,
          name_cn,
          slug,
          city,
          province,
          logo_url,
          image_url,
          cover_image_url,
          images,
          type,
          category,
          ranking_national,
          ranking_world,
          scholarship_available,
          accommodation_available,
          description,
          tuition_min,
          tuition_max,
          tuition_currency,
          application_deadline,
          intake_months,
          tags
        `)
        .not('ranking_national', 'is', null)
        .order('ranking_national', { ascending: true })
        .limit(limit);

      const { data: universities, error } = await withTimeout(
        featuredQuery,
        5000,
        'Featured universities query timed out'
      );

      if (error) {
        console.error('Error fetching featured universities:', error);
        return NextResponse.json({ error: 'Failed to fetch featured universities' }, { status: 500 });
      }

      const response = {
        universities: universities || [],
        total: universities?.length || 0,
        page: 1,
        limit,
        totalPages: 1
      };

      // Cache the response for 2 minutes
      apiCache.set(cacheKey, response, CACHE_TTL.MEDIUM);

      return NextResponse.json(response);
    }

    // Build base query for counting
    let countQuery = supabase
      .from('universities')
      .select('id', { count: 'exact', head: true });

    // Apply filters to count query
    if (search) {
      countQuery = countQuery.or(`name_en.ilike.%${search}%,name_cn.ilike.%${search}%`);
    }
    if (province && province !== 'all') {
      countQuery = countQuery.eq('province', province);
    }
    if (type && type !== 'all') {
      countQuery = countQuery.contains('type', [type]);
    }
    if (category && category !== 'all') {
      countQuery = countQuery.eq('category', category);
    }
    if (scholarship === 'true') {
      countQuery = countQuery.eq('scholarship_available', true);
    }
    if (english === 'true') {
      countQuery = countQuery.contains('teaching_languages', ['English']);
    }

    // Get total count with timeout
    const countResult = await withTimeout(
      countQuery,
      5000,
      'Count query timed out'
    );
    const { count, error: countError } = countResult;
    if (countError) {
      console.error('Error counting universities:', countError);
      return NextResponse.json({ error: 'Failed to count universities' }, { status: 500 });
    }

    // Build data query with pagination
    const offset = (page - 1) * limit;
    let dataQuery = supabase
      .from('universities')
      .select(`
        id,
        name_en,
        name_cn,
        slug,
        city,
        province,
        logo_url,
        image_url,
        cover_image_url,
        images,
        type,
        category,
        ranking_national,
        ranking_world,
        scholarship_available,
        accommodation_available,
        description,
        tuition_min,
        tuition_max,
        tuition_currency,
        application_deadline,
        intake_months,
        tags
      `)
      .order('name_en', { ascending: true })
      .range(offset, offset + limit - 1);

    // Apply filters to data query
    if (search) {
      dataQuery = dataQuery.or(`name_en.ilike.%${search}%,name_cn.ilike.%${search}%`);
    }
    if (province && province !== 'all') {
      dataQuery = dataQuery.eq('province', province);
    }
    if (type && type !== 'all') {
      dataQuery = dataQuery.contains('type', [type]);
    }
    if (category && category !== 'all') {
      dataQuery = dataQuery.eq('category', category);
    }
    if (scholarship === 'true') {
      dataQuery = dataQuery.eq('scholarship_available', true);
    }
    if (english === 'true') {
      dataQuery = dataQuery.contains('teaching_languages', ['English']);
    }

    // Add timeout to data query
    const { data: universities, error } = await withTimeout(
      dataQuery,
      5000,
      'Data query timed out'
    );

    if (error) {
      console.error('Error fetching universities:', error);
      return NextResponse.json({ error: 'Failed to fetch universities' }, { status: 500 });
    }

    const response = {
      universities: universities || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };

    // Cache the response for 2 minutes
    apiCache.set(cacheKey, response, CACHE_TTL.MEDIUM);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in universities GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
