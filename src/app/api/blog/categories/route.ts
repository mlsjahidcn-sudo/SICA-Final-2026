import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog/categories - Get all blog categories
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    // Get all active categories with post count
    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select(`
        id,
        name_en,
        name_cn,
        slug,
        description_en,
        description_cn,
        icon,
        color,
        parent_id,
        sort_order
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching blog categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Get post count for each category
    const { data: postCounts } = await supabase
      .from('blog_posts')
      .select('category_id')
      .eq('status', 'published');

    const countMap = (postCounts || []).reduce((acc, post) => {
      if (post.category_id) {
        acc[post.category_id] = (acc[post.category_id] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Transform the data
    const transformedCategories = categories?.map(cat => ({
      id: cat.id,
      name: locale === 'cn' ? (cat.name_cn || cat.name_en) : cat.name_en,
      slug: cat.slug,
      description: locale === 'cn' ? (cat.description_cn || cat.description_en) : cat.description_en,
      icon: cat.icon,
      color: cat.color,
      parentId: cat.parent_id,
      postCount: countMap[cat.id] || 0,
    })) || [];

    return NextResponse.json({ categories: transformedCategories });
  } catch (error) {
    console.error('Error in blog categories API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
