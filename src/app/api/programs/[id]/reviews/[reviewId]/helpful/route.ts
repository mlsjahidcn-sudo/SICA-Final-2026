import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST /api/programs/[id]/reviews/[reviewId]/helpful - Mark review as helpful
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; reviewId: string }> }
) {
  try {
    const { id, reviewId } = await params;
    const supabase = getSupabaseClient();

    // Get current helpful count
    const { data: review, error: fetchError } = await supabase
      .from('program_reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .eq('program_id', id)
      .single();

    if (fetchError || !review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Increment helpful count
    const { error } = await supabase
      .from('program_reviews')
      .update({ 
        helpful_count: (review.helpful_count || 0) + 1 
      })
      .eq('id', reviewId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to mark review as helpful' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      helpful_count: (review.helpful_count || 0) + 1
    });
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    return NextResponse.json(
      { error: 'Failed to mark review as helpful' },
      { status: 500 }
    );
  }
}
