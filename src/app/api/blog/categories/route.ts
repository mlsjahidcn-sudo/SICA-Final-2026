import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/blog/categories - Get all blog categories
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const locale = request.nextUrl.searchParams.get('locale') || 'en';

    // Use RPC function to bypass schema cache issue
    const { data: categories, error } = await supabase
      .rpc('get_blog_categories');

    if (error) {
      console.error('Error fetching blog categories:', error);
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    // Transform the data
    const transformedCategories = categories?.map((cat: {
      id: string;
      name_en: string;
      name_cn: string | null;
      slug: string;
      description_en: string | null;
      description_cn: string | null;
      icon: string | null;
      color: string | null;
      is_active: boolean | null;
      sort_order: number | null;
    }) => ({
      id: cat.id,
      name: locale === 'cn' ? (cat.name_cn || cat.name_en) : cat.name_en,
      slug: cat.slug,
      description: locale === 'cn' ? (cat.description_cn || cat.description_en) : cat.description_en,
      icon: cat.icon,
      color: cat.color,
      postCount: 0, // Will be calculated on client if needed
    })) || [];

    return NextResponse.json({ categories: transformedCategories });
  } catch (error) {
    console.error('Error in blog categories API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
