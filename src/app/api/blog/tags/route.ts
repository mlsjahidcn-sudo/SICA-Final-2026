import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog/tags - Get all blog tags
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    // Use RPC function to bypass schema cache issue
    const { data: tags, error } = await supabase
      .rpc('get_blog_tags');

    if (error) {
      console.error('Error fetching blog tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Transform the data
    const transformedTags = tags?.map((tag: {
      id: string;
      name_en: string;
      name_cn: string | null;
      slug: string;
      color: string | null;
    }) => ({
      id: tag.id,
      name: locale === 'cn' ? (tag.name_cn || tag.name_en) : tag.name_en,
      slug: tag.slug,
      color: tag.color,
      postCount: 0, // Will be calculated on client if needed
    })) || [];

    return NextResponse.json({ tags: transformedTags });
  } catch (error) {
    console.error('Error in blog tags API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
