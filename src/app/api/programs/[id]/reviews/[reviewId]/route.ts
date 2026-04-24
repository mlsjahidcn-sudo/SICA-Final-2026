import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/programs/[id]/reviews/[reviewId] - Get single review
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params;
    const supabase = getSupabaseClient();

    const { data: review, error } = await supabase
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
      `)
      .eq('id', reviewId)
      .eq('program_id', id)
      .single();

    if (error || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PUT /api/programs/[id]/reviews/[reviewId] - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params;
    const body = await request.json();
    const { rating, title, content, user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if review exists and belongs to user
    const { data: existingReview, error: fetchError } = await supabase
      .from('program_reviews')
      .select('id, user_id')
      .eq('id', reviewId)
      .eq('program_id', id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.user_id !== user_id) {
      return NextResponse.json(
        { error: 'You can only update your own reviews' },
        { status: 403 }
      );
    }

    // Update review
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (rating) updateData.rating = rating;
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    const { data: review, error } = await supabase
      .from('program_reviews')
      .update(updateData)
      .eq('id', reviewId)
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
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id]/reviews/[reviewId] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if review exists and belongs to user
    const { data: existingReview, error: fetchError } = await supabase
      .from('program_reviews')
      .select('id, user_id')
      .eq('id', reviewId)
      .eq('program_id', id)
      .single();

    if (fetchError || !existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (existingReview.user_id !== userId) {
      return NextResponse.json(
        { error: 'You can only delete your own reviews' },
        { status: 403 }
      );
    }

    const { error } = await supabase
      .from('program_reviews')
      .delete()
      .eq('id', reviewId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete review' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
}
