import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Types for the Supabase response
interface BlogCategory {
  id: string;
  name_en: string;
  name_cn: string | null;
  slug: string;
  icon: string | null;
  color: string | null;
}

interface BlogTag {
  id: string;
  name_en: string;
  name_cn: string | null;
  slug: string;
  color: string | null;
}

interface BlogPostTag {
  blog_tags: BlogTag;
}

interface BlogPost {
  id: string;
  slug: string;
  title_en: string;
  title_cn: string | null;
  excerpt_en: string | null;
  excerpt_cn: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  author_name: string;
  author_avatar_url: string | null;
  is_featured: boolean;
  view_count: number;
  reading_time_minutes: number;
  published_at: string | null;
  created_at: string;
  category_id: string | null;
  blog_categories: BlogCategory | null;
  blog_post_tags: BlogPostTag[];
}

// GET /api/blog - Get all published blog posts with filtering and pagination
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

    // Build query for posts
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
        is_featured,
        view_count,
        reading_time_minutes,
        published_at,
        created_at,
        category_id,
        blog_categories (
          id,
          name_en,
          name_cn,
          slug,
          icon,
          color
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
      .order('published_at', { ascending: false });

    // Apply filters
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

    if (tag) {
      const { data: tagData } = await supabase
        .from('blog_tags')
        .select('id')
        .eq('slug', tag)
        .single();
      
      if (tagData) {
        // Get post IDs that have this tag
        const { data: postTags } = await supabase
          .from('blog_post_tags')
          .select('post_id')
          .eq('tag_id', tagData.id);
        
        if (postTags && postTags.length > 0) {
          const postIds = postTags.map(pt => pt.post_id);
          query = query.in('id', postIds);
        } else {
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

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`title_en.ilike.${searchTerm},title_cn.ilike.${searchTerm},excerpt_en.ilike.${searchTerm},excerpt_cn.ilike.${searchTerm}`);
    }

    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Transform the data
    const transformedPosts = (posts as unknown as BlogPost[])?.map(post => ({
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
      isFeatured: post.is_featured,
      viewCount: post.view_count,
      readingTime: post.reading_time_minutes,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      category: post.blog_categories ? {
        id: post.blog_categories.id,
        name: locale === 'cn' ? (post.blog_categories.name_cn || post.blog_categories.name_en) : post.blog_categories.name_en,
        slug: post.blog_categories.slug,
        icon: post.blog_categories.icon,
        color: post.blog_categories.color,
      } : null,
      tags: post.blog_post_tags?.map((pt) => ({
        id: pt.blog_tags.id,
        name: locale === 'cn' ? (pt.blog_tags.name_cn || pt.blog_tags.name_en) : pt.blog_tags.name_en,
        slug: pt.blog_tags.slug,
        color: pt.blog_tags.color,
      })) || [],
    })) || [];

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
