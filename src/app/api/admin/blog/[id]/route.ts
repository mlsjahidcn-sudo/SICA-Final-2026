import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

// GET /api/admin/blog/[id] - Get a single blog post for editing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    // Use RPC function to bypass schema cache issue
    const { data: post, error } = await supabase
      .rpc('get_blog_post_by_id', { p_id: id });

    if (error || !post || post.length === 0) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const postData = post[0];

    // Transform to match expected format
    return NextResponse.json({
      post: {
        ...postData,
        blog_categories: postData.category_id ? {
          id: postData.category_id,
          name_en: postData.category_name_en,
          name_cn: postData.category_name_cn,
          slug: postData.category_slug,
        } : null,
        tags: [], // Tags will be loaded separately if needed
      },
    });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/blog/[id] - Update a blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;
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
      status,
      is_featured,
      allow_comments,
      seo_title,
      seo_description,
      seo_keywords,
      faqs,
      internal_links,
    } = body;

    // Calculate reading time if content changed
    let readingTime;
    if (content_en) {
      const wordCount = content_en.split(/\s+/).length;
      readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Use RPC function to bypass schema cache issue
    const { data: success, error } = await supabase
      .rpc('update_blog_post', {
        p_id: id,
        p_title: title_en,
        p_title_en: title_en,
        p_title_cn: title_cn,
        p_slug: slug,
        p_content: content_en,
        p_content_en: content_en,
        p_content_cn: content_cn,
        p_excerpt_en: excerpt_en,
        p_excerpt_cn: excerpt_cn,
        p_featured_image_url: featured_image_url,
        p_featured_image_alt: featured_image_alt,
        p_category_id: category_id,
        p_author_name: author_name,
        p_author_avatar_url: author_avatar_url,
        p_status: status,
        p_is_featured: is_featured,
        p_allow_comments: allow_comments,
        p_seo_title: seo_title,
        p_seo_description: seo_description,
        p_seo_keywords: seo_keywords,
        p_faqs: faqs,
        p_internal_links: internal_links,
        p_reading_time_minutes: readingTime,
      });

    if (error) {
      console.error('Error updating blog post:', error);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    if (!success) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin blog PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/blog/[id] - Delete a blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { id } = await params;

    // Delete the post (this will cascade to blog_post_tags)
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin blog DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
