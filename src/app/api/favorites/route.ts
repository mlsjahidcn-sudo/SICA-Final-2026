import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/favorites - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'program' or 'university'

    const supabase = getSupabaseClient();

    let query = supabase
      .from('favorites')
      .select(`
        id,
        item_type,
        item_id,
        created_at,
        programs:item_id (
          id,
          name_en,
          name_zh,
          degree_type,
          tuition_fee,
          duration,
          universities (
            id,
            name_en,
            name_zh,
            logo_url
          )
        ),
        universities:item_id (
          id,
          name_en,
          name_zh,
          logo_url,
          city,
          province
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('item_type', type);
    }

    const { data: favorites, error } = await query;

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    // Transform the data to flatten the structure
    const transformedFavorites = (favorites || []).map(fav => ({
      id: fav.id,
      item_type: fav.item_type,
      item_id: fav.item_id,
      created_at: fav.created_at,
      item: fav.item_type === 'program' ? fav.programs : fav.universities,
    }));

    return NextResponse.json({ favorites: transformedFavorites });
  } catch (error) {
    console.error('Error in favorites GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/favorites - Add a favorite
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { item_type, item_id } = body;

    if (!item_type || !item_id) {
      return NextResponse.json(
        { error: 'item_type and item_id are required' },
        { status: 400 }
      );
    }

    if (!['program', 'university'].includes(item_type)) {
      return NextResponse.json(
        { error: 'item_type must be "program" or "university"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_type', item_type)
      .eq('item_id', item_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Already favorited', favorite: existing },
        { status: 400 }
      );
    }

    // Add favorite
    const { data: favorite, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        item_type,
        item_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Added to favorites',
      favorite 
    });
  } catch (error) {
    console.error('Error in favorites POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/favorites - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const item_type = searchParams.get('item_type');
    const item_id = searchParams.get('item_id');

    const supabase = getSupabaseClient();

    let query = supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id);

    if (id) {
      query = query.eq('id', id);
    } else if (item_type && item_id) {
      query = query.eq('item_type', item_type).eq('item_id', item_id);
    } else {
      return NextResponse.json(
        { error: 'Either id or both item_type and item_id are required' },
        { status: 400 }
      );
    }

    const { error } = await query;

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error in favorites DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
