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

    // Get published post counts for each tag via junction table
    const tagIds = (tags || []).map(t => t.id);
    const { data: postTagLinks } = tagIds.length > 0
      ? await supabase
          .from('blog_post_tags')
          .select('tag_id, post_id')
          .in('tag_id', tagIds)
      : { data: [] };

    // Get only published posts
    const postIds = [...new Set((postTagLinks || []).map(pt => pt.post_id))];
    const { data: publishedPosts } = postIds.length > 0
      ? await supabase
          .from('blog_posts')
          .select('id')
          .eq('status', 'published')
          .in('id', postIds)
      : { data: [] };
    const publishedPostSet = new Set((publishedPosts || []).map(p => p.id));

    const countMap: Record<string, number> = {};
    (postTagLinks || []).forEach((pt: { tag_id: string; post_id: string }) => {
      if (publishedPostSet.has(pt.post_id)) {
        countMap[pt.tag_id] = (countMap[pt.tag_id] || 0) + 1;
      }
    });

    // Transform the data
    const transformedTags = (tags || []).map((tag) => ({
      id: tag.id,
      name: locale === 'cn' ? (tag.name_cn || tag.name_en) : tag.name_en,
      slug: tag.slug,
      color: tag.color,
      postCount: countMap[tag.id] || 0,
    }));

    return NextResponse.json({ tags: transformedTags });
  } catch (error) {
    console.error('Error in blog tags API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
