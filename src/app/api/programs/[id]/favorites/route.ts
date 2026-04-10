import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/programs/[id]/favorites - Check if program is favorited
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: favorite, error } = await supabase
      .from('program_favorites')
      .select('id, notes, created_at')
      .eq('program_id', id)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      is_favorited: !!favorite,
      favorite: favorite || null
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}

// POST /api/programs/[id]/favorites - Add to favorites
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, notes } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if already favorited
    const { data: existing } = await supabase
      .from('program_favorites')
      .select('id')
      .eq('program_id', id)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Program already in favorites' },
        { status: 400 }
      );
    }

    // Add to favorites
    const { data: favorite, error } = await supabase
      .from('program_favorites')
      .insert({
        program_id: id,
        user_id,
        notes: notes || null
      })
      .select(`
        id,
        notes,
        created_at,
        programs (
          id,
          name,
          degree_level,
          universities (
            id,
            name_en,
            logo_url
          )
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to add to favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite }, { status: 201 });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json(
      { error: 'Failed to add to favorites' },
      { status: 500 }
    );
  }
}

// DELETE /api/programs/[id]/favorites - Remove from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('program_favorites')
      .delete()
      .eq('program_id', id)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove from favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json(
      { error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
}

// PATCH /api/programs/[id]/favorites - Update notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { user_id, notes } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { data: favorite, error } = await supabase
      .from('program_favorites')
      .update({ notes })
      .eq('program_id', id)
      .eq('user_id', user_id)
      .select(`
        id,
        notes,
        created_at
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update notes' },
        { status: 500 }
      );
    }

    return NextResponse.json({ favorite });
  } catch (error) {
    console.error('Error updating favorite notes:', error);
    return NextResponse.json(
      { error: 'Failed to update notes' },
      { status: 500 }
    );
  }
}
