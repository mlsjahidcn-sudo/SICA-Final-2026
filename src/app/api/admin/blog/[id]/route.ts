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
          tag_id
        )
      `)
      .eq('id', id)
      .single();

    if (error || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Extract tag IDs from the junction table
    const tags = post.blog_post_tags?.map((pt: { tag_id: string }) => pt.tag_id) || [];
    
    // Transform to camelCase for frontend
    const transformedPost = {
      id: post.id,
      slug: post.slug,
      title_en: post.title_en,
      title_cn: post.title_cn,
      excerpt_en: post.excerpt_en,
      excerpt_cn: post.excerpt_cn,
      content_en: post.content_en,
      content_cn: post.content_cn,
      featured_image_url: post.featured_image_url,
      featured_image_alt: post.featured_image_alt,
      category_id: post.category_id,
      author_name: post.author_name,
      author_avatar_url: post.author_avatar_url,
      status: post.status,
      is_featured: post.is_featured,
      allow_comments: post.allow_comments,
      seo_title: post.seo_title,
      seo_description: post.seo_description,
      seo_keywords: post.seo_keywords,
      faqs: post.faqs,
      internal_links: post.internal_links,
      view_count: post.view_count,
      reading_time_minutes: post.reading_time_minutes,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at,
      tags,
      category: post.blog_categories,
    };
    
    return NextResponse.json({ post: transformedPost });
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

    // Extract tags from body (handled separately)
    const { tags, ...bodyWithoutTags } = body;

    // Validate if post exists
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('id, slug')
      .eq('id', id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Validate title_en if provided
    if (bodyWithoutTags.title_en !== undefined && !bodyWithoutTags.title_en.trim()) {
      return NextResponse.json(
        { error: 'Title (English) cannot be empty' },
        { status: 400 }
      );
    }

    // Validate content_en if provided
    if (bodyWithoutTags.content_en !== undefined && !bodyWithoutTags.content_en.trim()) {
      return NextResponse.json(
        { error: 'Content (English) cannot be empty' },
        { status: 400 }
      );
    }

    // Validate slug format if provided
    if (bodyWithoutTags.slug !== undefined) {
      if (!bodyWithoutTags.slug.trim()) {
        return NextResponse.json(
          { error: 'Slug cannot be empty' },
          { status: 400 }
        );
      }

      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(bodyWithoutTags.slug)) {
        return NextResponse.json(
          { error: 'Slug must be lowercase, alphanumeric, and use hyphens instead of spaces (e.g., "my-blog-post")' },
          { status: 400 }
        );
      }

      // Check for duplicate slug (if slug is being changed)
      if (bodyWithoutTags.slug !== existingPost.slug) {
        const { data: duplicateSlug } = await supabase
          .from('blog_posts')
          .select('id')
          .eq('slug', bodyWithoutTags.slug)
          .neq('id', id)
          .single();

        if (duplicateSlug) {
          return NextResponse.json(
            { error: 'A post with this slug already exists' },
            { status: 400 }
          );
        }
      }
    }

    // Validate status if provided
    if (bodyWithoutTags.status !== undefined) {
      const validStatuses = ['draft', 'published', 'archived'];
      if (!validStatuses.includes(bodyWithoutTags.status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be one of: draft, published, archived' },
          { status: 400 }
        );
      }
    }

    // Validate arrays if provided
    if (bodyWithoutTags.seo_keywords !== undefined && !Array.isArray(bodyWithoutTags.seo_keywords)) {
      return NextResponse.json(
        { error: 'seo_keywords must be an array' },
        { status: 400 }
      );
    }

    if (bodyWithoutTags.faqs !== undefined && !Array.isArray(bodyWithoutTags.faqs)) {
      return NextResponse.json(
        { error: 'faqs must be an array' },
        { status: 400 }
      );
    }

    if (bodyWithoutTags.internal_links !== undefined && !Array.isArray(bodyWithoutTags.internal_links)) {
      return NextResponse.json(
        { error: 'internal_links must be an array' },
        { status: 400 }
      );
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return NextResponse.json(
        { error: 'tags must be an array' },
        { status: 400 }
      );
    }

    // Validate category_id if provided
    if (bodyWithoutTags.category_id !== undefined && bodyWithoutTags.category_id !== null) {
      const { data: category } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('id', bodyWithoutTags.category_id)
        .single();

      if (!category) {
        return NextResponse.json(
          { error: 'Invalid category_id' },
          { status: 400 }
        );
      }
    }

    // Validate tag_ids if provided
    if (tags !== undefined && tags.length > 0) {
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

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    // Copy all provided fields
    const fields = [
      'title_en', 'title_cn', 'slug', 'excerpt_en', 'excerpt_cn',
      'content_en', 'content_cn', 'featured_image_url', 'featured_image_alt',
      'category_id', 'author_name', 'author_avatar_url', 'status',
      'is_featured', 'allow_comments', 'seo_title', 'seo_description',
      'seo_keywords', 'faqs', 'internal_links'
    ];

    for (const field of fields) {
      if (bodyWithoutTags[field] !== undefined) {
        updateData[field] = bodyWithoutTags[field];
      }
    }

    // Note: Database does not have 'title' and 'content' columns
    // Only title_en, title_cn, content_en, content_cn exist

    // Calculate reading time if content changed
    if (bodyWithoutTags.content_en) {
      const wordCount = bodyWithoutTags.content_en.split(/\s+/).length;
      updateData.reading_time_minutes = Math.max(1, Math.ceil(wordCount / 200));
    }

    // Handle published_at for newly published posts
    if (bodyWithoutTags.status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating blog post:', error);
      return NextResponse.json({ error: 'Failed to update post', details: error.message }, { status: 500 });
    }

    // Sync tags if provided
    if (tags !== undefined) {
      // Delete existing tags
      await supabase
        .from('blog_post_tags')
        .delete()
        .eq('post_id', id);

      // Insert new tags
      if (tags.length > 0) {
        const tagInserts = tags.map((tagId: string) => ({
          post_id: id,
          tag_id: tagId,
        }));
        const { error: tagError } = await supabase
          .from('blog_post_tags')
          .insert(tagInserts);

        if (tagError) {
          console.error('Error syncing tags:', tagError);
          // Don't fail the whole request, just log the error
        }
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

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting blog post:', error);
      return NextResponse.json({ error: 'Failed to delete post', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in admin blog DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
