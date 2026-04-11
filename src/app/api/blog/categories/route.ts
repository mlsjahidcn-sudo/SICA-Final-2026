import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog/categories - Get all blog categories
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    const { data: categories, error } = await supabase
      .from('blog_categories')
      .select('id, name_en, name_cn, slug, description_en, description_cn, icon, color')
      .or('is_active.eq.true,is_active.is.null')
      .order('sort_order')
      .order('name_en');

    if (error) {
      console.error('Error fetching blog categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories', details: error.message }, { status: 500 });
    }

    // Transform the data
    const transformedCategories = (categories || []).map((cat) => ({
      id: cat.id,
      name: locale === 'cn' ? (cat.name_cn || cat.name_en) : cat.name_en,
      slug: cat.slug,
      description: locale === 'cn' ? (cat.description_cn || cat.description_en) : cat.description_en,
      icon: cat.icon,
      color: cat.color,
      postCount: 0,
    }));

    return NextResponse.json({ categories: transformedCategories });
  } catch (error) {
    console.error('Error in blog categories API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
