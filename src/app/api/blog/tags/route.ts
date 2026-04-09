import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog/tags - Get all blog tags with post count
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    // Get all tags
    const { data: tags, error } = await supabase
      .from('blog_tags')
      .select(`
        id,
        name_en,
        name_cn,
        slug,
        color
      `)
      .order('name_en', { ascending: true });

    if (error) {
      console.error('Error fetching blog tags:', error);
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
    }

    // Get post count for each tag
    const { data: postTags } = await supabase
      .from('blog_post_tags')
      .select(`
        tag_id,
        blog_posts!inner (
          status
        )
      `);

    interface PostTagItem {
      tag_id: string;
      blog_posts: { status: string } | { status: string }[] | null;
    }

    const countMap = (postTags as unknown as PostTagItem[] || []).reduce((acc, pt) => {
      if (pt.blog_posts) {
        // blog_posts could be an array or single object
        const posts = Array.isArray(pt.blog_posts) ? pt.blog_posts : [pt.blog_posts];
        posts.forEach((post) => {
          if (post && post.status === 'published') {
            acc[pt.tag_id] = (acc[pt.tag_id] || 0) + 1;
          }
        });
      }
      return acc;
    }, {} as Record<string, number>);

    // Transform the data
    const transformedTags = tags?.map(tag => ({
      id: tag.id,
      name: locale === 'cn' ? (tag.name_cn || tag.name_en) : tag.name_en,
      slug: tag.slug,
      color: tag.color,
      postCount: countMap[tag.id] || 0,
    })) || [];

    // Only return tags that have posts
    const tagsWithPosts = transformedTags.filter(tag => tag.postCount > 0);

    return NextResponse.json({ tags: tagsWithPosts });
  } catch (error) {
    console.error('Error in blog tags API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
