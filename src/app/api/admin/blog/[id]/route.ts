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

    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        *,
        blog_categories (
          id,
          name_en,
          name_cn,
          slug
        ),
        blog_post_tags (
          tag_id,
          blog_tags (
            id,
            name_en,
            name_cn,
            slug
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Transform tags
    const tags = post.blog_post_tags?.map((pt: { tag_id: string; blog_tags: { id: string; name_en: string; name_cn: string | null; slug: string } }) => ({
      id: pt.blog_tags.id,
      name: pt.blog_tags.name_en,
      nameCn: pt.blog_tags.name_cn,
      slug: pt.blog_tags.slug,
    })) || [];

    return NextResponse.json({
      post: {
        ...post,
        tags,
        blog_post_tags: undefined,
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
      tags,
    } = body;

    // Check if post exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Calculate reading time if content changed
    let readingTime;
    if (content_en) {
      const wordCount = content_en.split(/\s+/).length;
      readingTime = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title_en !== undefined) updateData.title_en = title_en;
    if (title_cn !== undefined) updateData.title_cn = title_cn;
    if (slug !== undefined) updateData.slug = slug;
    if (excerpt_en !== undefined) updateData.excerpt_en = excerpt_en;
    if (excerpt_cn !== undefined) updateData.excerpt_cn = excerpt_cn;
    if (content_en !== undefined) updateData.content_en = content_en;
    if (content_cn !== undefined) updateData.content_cn = content_cn;
    if (featured_image_url !== undefined) updateData.featured_image_url = featured_image_url;
    if (featured_image_alt !== undefined) updateData.featured_image_alt = featured_image_alt;
    if (category_id !== undefined) updateData.category_id = category_id;
    if (author_name !== undefined) updateData.author_name = author_name;
    if (author_avatar_url !== undefined) updateData.author_avatar_url = author_avatar_url;
    if (status !== undefined) {
      updateData.status = status;
      // Set published_at when publishing for the first time
      if (status === 'published' && existingPost.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (allow_comments !== undefined) updateData.allow_comments = allow_comments;
    if (seo_title !== undefined) updateData.seo_title = seo_title;
    if (seo_description !== undefined) updateData.seo_description = seo_description;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords;
    if (readingTime !== undefined) updateData.reading_time_minutes = readingTime;

    // Update the post
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating blog post:', updateError);
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
    }

    // Update tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase.from('blog_post_tags').delete().eq('post_id', id);

      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }));
        await supabase.from('blog_post_tags').insert(tagInserts);
      }
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

    // Delete the post (cascade will delete post_tags)
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
