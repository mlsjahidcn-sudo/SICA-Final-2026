import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/programs/[id]/reviews - Get program reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    const rating = searchParams.get('rating');

    // Build query
    let query = supabase
      .from('program_reviews')
      .select(`
        id,
        rating,
        title,
        content,
        is_verified,
        helpful_count,
        created_at,
        updated_at,
        users (
          id,
          full_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('program_id', id)
      .eq('is_published', true);

    // Filter by rating if provided
    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: reviews, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    // Get rating statistics
    const { data: stats } = await supabase
      .from('program_reviews')
      .select('rating')
      .eq('program_id', id)
      .eq('is_published', true);

    const ratingStats = {
      total: stats?.length || 0,
      average: stats?.length ? (stats.reduce((sum, r) => sum + r.rating, 0) / stats.length).toFixed(1) : 0,
      distribution: {
        5: stats?.filter(r => r.rating === 5).length || 0,
        4: stats?.filter(r => r.rating === 4).length || 0,
        3: stats?.filter(r => r.rating === 3).length || 0,
        2: stats?.filter(r => r.rating === 2).length || 0,
        1: stats?.filter(r => r.rating === 1).length || 0,
      }
    };

    return NextResponse.json({
      reviews: reviews || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: ratingStats
    });
  } catch (error) {
    console.error('Error fetching program reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST /api/programs/[id]/reviews - Create a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rating, title, content, user_id } = body;

    // Validate required fields
    if (!rating || !user_id) {
      return NextResponse.json(
        { error: 'Rating and user_id are required' },
        { status: 400 }
      );
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if user already reviewed this program
    const { data: existingReview } = await supabase
      .from('program_reviews')
      .select('id')
      .eq('program_id', id)
      .eq('user_id', user_id)
      .single();

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this program' },
        { status: 400 }
      );
    }

    // Create review
    const { data: review, error } = await supabase
      .from('program_reviews')
      .insert({
        program_id: id,
        user_id,
        rating,
        title: title || null,
        content: content || null,
        is_verified: false,
        is_published: true,
        helpful_count: 0
      })
      .select(`
        id,
        rating,
        title,
        content,
        is_verified,
        helpful_count,
        created_at,
        users (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Error creating program review:', error);
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
}
