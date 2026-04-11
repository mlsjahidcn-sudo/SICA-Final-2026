import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

// GET /api/admin/blog - Get all blog posts (including drafts) for admin
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    // Use RPC function to bypass schema cache issue
    const { data: posts, error } = await supabase
      .rpc('get_blog_posts_admin', {
        p_limit: limit,
        p_offset: offset,
        p_status: status && status !== 'all' ? status : null,
      });

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Calculate total from the first row (total_count is returned in each row)
    const totalCount = posts && posts.length > 0 ? (posts[0] as { total_count: bigint }).total_count : BigInt(0);

    // Transform posts to match expected format
    const transformedPosts = posts?.map((post: {
      id: string;
      slug: string;
      title_en: string;
      title_cn: string | null;
      excerpt_en: string | null;
      excerpt_cn: string | null;
      featured_image_url: string | null;
      author_name: string | null;
      status: string;
      is_featured: boolean | null;
      view_count: number | null;
      published_at: string | null;
      created_at: string;
      updated_at: string | null;
      category_id: string | null;
      category_name_en: string | null;
      category_name_cn: string | null;
      category_slug: string | null;
    }) => ({
      id: post.id,
      slug: post.slug,
      title_en: post.title_en,
      title_cn: post.title_cn,
      excerpt_en: post.excerpt_en,
      excerpt_cn: post.excerpt_cn,
      featured_image_url: post.featured_image_url,
      author_name: post.author_name,
      status: post.status,
      is_featured: post.is_featured,
      view_count: post.view_count,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      category_id: post.category_id,
      blog_categories: post.category_id ? {
        id: post.category_id,
        name_en: post.category_name_en,
        name_cn: post.category_name_cn,
        slug: post.category_slug,
      } : null,
    })) || [];

    return NextResponse.json({
      posts: transformedPosts,
      total: Number(totalCount),
      page,
      limit,
      totalPages: Math.ceil(Number(totalCount) / limit),
      stats: {
        total: Number(totalCount),
        published: posts?.filter((p: { status: string }) => p.status === 'published').length || 0,
        draft: posts?.filter((p: { status: string }) => p.status === 'draft').length || 0,
        archived: posts?.filter((p: { status: string }) => p.status === 'archived').length || 0,
      },
    });
  } catch (error) {
    console.error('Error in admin blog API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/blog - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const body = await request.json();
    const {
      title_en,
      title_cn,
      slug,
      excerpt_en,
      excerpt_cn,
      content_en,
      content_cn,
      featured_image_url,
      featured_image_alt,
      category_id,
      author_name,
      author_avatar_url,
      status = 'draft',
      is_featured = false,
      allow_comments = true,
      seo_title,
      seo_description,
      seo_keywords,
      faqs = [],
      internal_links = [],
      tags = [],
    } = body;

    // Validate required fields
    if (!title_en || !slug || !content_en) {
      return NextResponse.json(
        { error: 'Title (English), slug, and content (English) are required' },
        { status: 400 }
      );
    }

    // Calculate reading time (average 200 words per minute)
    const wordCount = content_en.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Use RPC function to bypass schema cache issue
    const { data: postId, error } = await supabase
      .rpc('create_blog_post', {
        p_title: title_en,
        p_title_en: title_en,
        p_title_cn: title_cn || null,
        p_slug: slug,
        p_content: content_en,
        p_content_en: content_en,
        p_content_cn: content_cn || null,
        p_excerpt_en: excerpt_en || null,
        p_excerpt_cn: excerpt_cn || null,
        p_featured_image_url: featured_image_url || null,
        p_featured_image_alt: featured_image_alt || null,
        p_category_id: category_id || null,
        p_author_name: author_name || adminCheck.full_name || 'Admin',
        p_author_avatar_url: author_avatar_url || null,
        p_status: status,
        p_is_featured: is_featured,
        p_allow_comments: allow_comments,
        p_seo_title: seo_title || null,
        p_seo_description: seo_description || null,
        p_seo_keywords: seo_keywords || null,
        p_faqs: faqs,
        p_internal_links: internal_links,
        p_reading_time_minutes: readingTime,
      });

    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Add tags if provided (this still uses direct table access, might need workaround)
    if (tags.length > 0) {
      // Note: blog_post_tags might also have schema cache issues
      // For now, we'll skip tags if the schema cache issue persists
      try {
        const tagInserts = tags.map((tagId: string) => ({
          post_id: postId,
          tag_id: tagId,
        }));
        await supabase.from('blog_post_tags').insert(tagInserts);
      } catch (tagError) {
        console.error('Error adding tags (non-critical):', tagError);
        // Don't fail the whole request for tags
      }
    }

    return NextResponse.json({ post: { id: postId } }, { status: 201 });
  } catch (error) {
    console.error('Error in admin blog POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
