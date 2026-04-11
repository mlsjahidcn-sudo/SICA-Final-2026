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
  description_en: string | null;
  description_cn: string | null;
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
  content_en: string | null;
  content_cn: string | null;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  author_id: string | null;
  author_name: string;
  author_avatar_url: string | null;
  is_featured: boolean;
  view_count: number;
  reading_time_minutes: number;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  faqs: Array<{ question: string; answer: string }> | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  blog_categories: BlogCategory | null;
  blog_post_tags: BlogPostTag[];
}

// GET /api/blog/[slug] - Get a single blog post by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const { slug } = await params;
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    // Get the post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        slug,
        title_en,
        title_cn,
        excerpt_en,
        excerpt_cn,
        content_en,
        content_cn,
        featured_image_url,
        featured_image_alt,
        author_id,
        author_name,
        author_avatar_url,
        is_featured,
        view_count,
        reading_time_minutes,
        seo_title,
        seo_description,
        seo_keywords,
        faqs,
        published_at,
        created_at,
        updated_at,
        category_id,
        blog_categories (
          id,
          name_en,
          name_cn,
          slug,
          icon,
          color,
          description_en,
          description_cn
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
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Type assertion for proper typing
    const typedPost = post as unknown as BlogPost;

    // Increment view count
    await supabase
      .from('blog_posts')
      .update({ view_count: typedPost.view_count + 1 })
      .eq('id', typedPost.id);

    // Get related posts (same category, exclude current post)
    const { data: relatedPosts } = await supabase
      .from('blog_posts')
      .select(`
        id,
        slug,
        title_en,
        title_cn,
        excerpt_en,
        excerpt_cn,
        featured_image_url,
        published_at
      `)
      .eq('status', 'published')
      .eq('category_id', typedPost.category_id)
      .neq('id', typedPost.id)
      .order('published_at', { ascending: false })
      .limit(3);

    // Transform the data
    const transformedPost = {
      id: typedPost.id,
      slug: typedPost.slug,
      title: locale === 'cn' ? (typedPost.title_cn || typedPost.title_en) : typedPost.title_en,
      excerpt: locale === 'cn' ? (typedPost.excerpt_cn || typedPost.excerpt_en) : typedPost.excerpt_en,
      content: locale === 'cn' ? (typedPost.content_cn || typedPost.content_en) : typedPost.content_en,
      featuredImage: typedPost.featured_image_url,
      featuredImageAlt: typedPost.featured_image_alt,
      author: {
        id: typedPost.author_id,
        name: typedPost.author_name,
        avatar: typedPost.author_avatar_url,
      },
      isFeatured: typedPost.is_featured,
      viewCount: typedPost.view_count + 1,
      readingTime: typedPost.reading_time_minutes,
      seo: {
        title: typedPost.seo_title,
        description: typedPost.seo_description,
        keywords: typedPost.seo_keywords,
      },
      publishedAt: typedPost.published_at,
      createdAt: typedPost.created_at,
      updatedAt: typedPost.updated_at,
      category: typedPost.blog_categories ? {
        id: typedPost.blog_categories.id,
        name: locale === 'cn' ? (typedPost.blog_categories.name_cn || typedPost.blog_categories.name_en) : typedPost.blog_categories.name_en,
        slug: typedPost.blog_categories.slug,
        icon: typedPost.blog_categories.icon,
        color: typedPost.blog_categories.color,
        description: locale === 'cn' ? (typedPost.blog_categories.description_cn || typedPost.blog_categories.description_en) : typedPost.blog_categories.description_en,
      } : null,
      tags: typedPost.blog_post_tags?.map((pt) => ({
        id: pt.blog_tags.id,
        name: locale === 'cn' ? (pt.blog_tags.name_cn || pt.blog_tags.name_en) : pt.blog_tags.name_en,
        slug: pt.blog_tags.slug,
        color: pt.blog_tags.color,
      })) || [],
      faqs: typedPost.faqs || [],
      relatedPosts: relatedPosts?.map(rp => ({
        id: rp.id,
        slug: rp.slug,
        title: locale === 'cn' ? (rp.title_cn || rp.title_en) : rp.title_en,
        excerpt: locale === 'cn' ? (rp.excerpt_cn || rp.excerpt_en) : rp.excerpt_en,
        featuredImage: rp.featured_image_url,
        publishedAt: rp.published_at,
      })) || [],
    };

    return NextResponse.json({ post: transformedPost });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
