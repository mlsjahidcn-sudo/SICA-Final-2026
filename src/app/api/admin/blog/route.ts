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
        author_name,
        status,
        is_featured,
        view_count,
        published_at,
        created_at,
        updated_at,
        category_id,
        blog_categories (
          id,
          name_en,
          name_cn,
          slug
        ),
        blog_post_tags (
          blog_tags (id, name_en, slug)
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts', details: error.message }, { status: 500 });
    }

    // Get stats via aggregate
    const { data: statsData } = await supabase
      .from('blog_posts')
      .select('status');

    const allStatuses = (statsData || []).map(p => p.status);
    const stats = {
      total: allStatuses.length,
      published: allStatuses.filter(s => s === 'published').length,
      draft: allStatuses.filter(s => s === 'draft').length,
      archived: allStatuses.filter(s => s === 'archived').length,
    };

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats,
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
    if (!title_en || !title_en.trim()) {
      return NextResponse.json(
        { error: 'Title (English) is required' },
        { status: 400 }
      );
    }

    if (!slug || !slug.trim()) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    if (!content_en || !content_en.trim()) {
      return NextResponse.json(
        { error: 'Content (English) is required' },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens only)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug must be lowercase, alphanumeric, and use hyphens instead of spaces (e.g., "my-blog-post")' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'published', 'archived'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: draft, published, archived' },
        { status: 400 }
      );
    }

    // Validate seo_keywords is an array
    if (seo_keywords !== undefined && !Array.isArray(seo_keywords)) {
      return NextResponse.json(
        { error: 'seo_keywords must be an array' },
        { status: 400 }
      );
    }

    // Validate faqs is an array
    if (faqs !== undefined && !Array.isArray(faqs)) {
      return NextResponse.json(
        { error: 'faqs must be an array' },
        { status: 400 }
      );
    }

    // Validate internal_links is an array
    if (internal_links !== undefined && !Array.isArray(internal_links)) {
      return NextResponse.json(
        { error: 'internal_links must be an array' },
        { status: 400 }
      );
    }

    // Validate tags is an array
    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'tags must be an array' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 400 }
      );
    }

    // Validate category_id exists if provided
    if (category_id) {
      const { data: category } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('id', category_id)
        .single();

      if (!category) {
        return NextResponse.json(
          { error: 'Invalid category_id' },
          { status: 400 }
        );
      }
    }

    // Validate tag_ids exist if provided
    if (tags.length > 0) {
      const { data: existingTags } = await supabase
        .from('blog_tags')
        .select('id')
        .in('id', tags);

      if (!existingTags || existingTags.length !== tags.length) {
        return NextResponse.json(
          { error: 'One or more invalid tag_ids' },
          { status: 400 }
        );
      }
    }

    // Calculate reading time (average 200 words per minute)
    const wordCount = content_en.split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Create the post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        title_en,
        title_cn,
        slug,
        content_en,
        content_cn,
        excerpt_en,
        excerpt_cn,
        featured_image_url,
        featured_image_alt,
        category_id,
        author_name: author_name || adminCheck.full_name || 'Admin',
        author_avatar_url,
        status,
        is_featured,
        allow_comments,
        seo_title,
        seo_description,
        seo_keywords,
        faqs,
        internal_links,
        reading_time_minutes: readingTime,
        published_at: status === 'published' ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json({ error: 'Failed to create post', details: error.message }, { status: 500 });
    }

    // Add tags if provided
    if (tags.length > 0 && post?.id) {
      const tagInserts = tags.map((tagId: string) => ({
        post_id: post.id,
        tag_id: tagId,
      }));
      await supabase.from('blog_post_tags').insert(tagInserts);
    }

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error('Error in admin blog POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
