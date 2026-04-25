import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog - Get all published blog posts with pagination
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const locale = searchParams.get('locale') || 'en';

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        slug,
        title_en,
        title_cn,
        excerpt_en,
        excerpt_cn,
        featured_image_url,
        featured_image_alt,
        author_name,
        author_avatar_url,
        view_count,
        reading_time_minutes,
        published_at,
        created_at,
        is_featured,
        category_id,
        blog_categories (
          id,
          name_en,
          name_cn,
          slug
        ),
        blog_post_tags (
          blog_tags (
            id,
            name_en,
            name_cn,
            slug,
            color
          )
        )
      `, { count: 'exact' })
      .eq('status', 'published')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    // Apply category filter
    if (category) {
      const { data: categoryData } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('slug', category)
        .single();

      if (categoryData) {
        query = query.eq('category_id', categoryData.id);
      }
    }

    // Apply tag filter
    if (tag) {
      const { data: tagData } = await supabase
        .from('blog_tags')
        .select('id')
        .eq('slug', tag)
        .single();

      if (tagData) {
        const { data: postTags } = await supabase
          .from('blog_post_tags')
          .select('post_id')
          .eq('tag_id', tagData.id);

        if (postTags && postTags.length > 0) {
          query = query.in('id', postTags.map(pt => pt.post_id));
        } else {
          // No posts with this tag
          return NextResponse.json({
            posts: [],
            total: 0,
            page,
            limit,
            totalPages: 0,
          });
        }
      }
    }

    // Apply search filter
    if (search) {
      query = query.or(`title_en.ilike.%${search}%,title_cn.ilike.%${search}%,excerpt_en.ilike.%${search}%,excerpt_cn.ilike.%${search}%`);
    }

    // Apply featured filter
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts', details: error.message }, { status: 500 });
    }

    // Transform posts for locale and convert to camelCase
    const transformedPosts = (posts || []).map(post => {
      // blog_categories might be an array or single object
      const category = post.blog_categories as { id: string; name_en: string; name_cn: string | null; slug: string; icon?: string | null; color?: string | null } | { id: string; name_en: string; name_cn: string | null; slug: string; icon?: string | null; color?: string | null }[] | null;
      const categoryData = Array.isArray(category) ? category[0] : category;

      // Extract tags from junction table
      const tags = (post.blog_post_tags || []).map((pt: any) => {
        const tag = pt.blog_tags;
        return {
          id: tag.id,
          name: locale === 'cn' ? (tag.name_cn || tag.name_en) : tag.name_en,
          slug: tag.slug,
          color: tag.color,
        };
      });

      return {
        id: post.id,
        slug: post.slug,
        title: locale === 'cn' ? (post.title_cn || post.title_en) : post.title_en,
        excerpt: locale === 'cn' ? (post.excerpt_cn || post.excerpt_en) : post.excerpt_en,
        featuredImage: post.featured_image_url,
        featuredImageAlt: post.featured_image_alt,
        author: {
          name: post.author_name,
          avatar: post.author_avatar_url,
        },
        isFeatured: post.is_featured || false,
        viewCount: post.view_count || 0,
        readingTime: post.reading_time_minutes || 1,
        publishedAt: post.published_at,
        category: categoryData ? {
          id: categoryData.id,
          name: locale === 'cn'
            ? (categoryData.name_cn || categoryData.name_en)
            : categoryData.name_en,
          slug: categoryData.slug,
          icon: categoryData.icon,
          color: categoryData.color,
        } : null,
        tags,
      };
    });

    return NextResponse.json({
      posts: transformedPosts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Error in blog API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
