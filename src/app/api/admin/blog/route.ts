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
    const category = searchParams.get('category');
    const search = searchParams.get('search');

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
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

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

    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`title_en.ilike.${searchTerm},title_cn.ilike.${searchTerm}`);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: posts, error, count } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }

    // Get stats
    const { data: stats } = await supabase
      .from('blog_posts')
      .select('status');

    const statusCounts = (stats || []).reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
      stats: {
        total: stats?.length || 0,
        published: statusCounts['published'] || 0,
        draft: statusCounts['draft'] || 0,
        archived: statusCounts['archived'] || 0,
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

    // Create the post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
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
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    // Add tags if provided
    if (tags.length > 0) {
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
