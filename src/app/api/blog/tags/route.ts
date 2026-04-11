import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog/tags - Get all blog tags
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    const { data: tags, error } = await supabase
      .from('blog_tags')
      .select('id, name_en, name_cn, slug, color')
      .order('name_en');

    if (error) {
      console.error('Error fetching blog tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags', details: error.message }, { status: 500 });
    }

    // Transform the data
    const transformedTags = (tags || []).map((tag) => ({
      id: tag.id,
      name: locale === 'cn' ? (tag.name_cn || tag.name_en) : tag.name_en,
      slug: tag.slug,
      color: tag.color,
      postCount: 0,
    }));

    return NextResponse.json({ tags: transformedTags });
  } catch (error) {
    console.error('Error in blog tags API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
