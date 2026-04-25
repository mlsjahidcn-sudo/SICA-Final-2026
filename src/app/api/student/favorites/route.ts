import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '@/lib/auth-utils';

// GET /api/student/favorites - List student's favorites
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'university' or 'program'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // If type is 'program', use program_favorites table
    if (type === 'program') {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data: programFavorites, error, count } = await supabase
        .from('program_favorites')
        .select(`
          id,
          notes,
          created_at,
          programs (
            id,
            name,
            degree_level,
            language,
            category,
            tuition_fee_per_year,
            currency,
            duration_years,
            scholarship_coverage,
            cover_image,
            rating,
            review_count,
            universities (
              id,
              name_en,
              name_cn,
              city,
              province,
              logo_url
            )
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error fetching program favorites:', error);
        return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
      }

      return NextResponse.json({ 
        favorites: programFavorites || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    }

    // For universities, use user_favorites table
    let query = supabase
      .from('user_favorites')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (type) {
      query = query.eq('entity_type', type);
    }

    query = query.order('created_at', { ascending: false });

    const { data: favorites, error, count } = await query;

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 });
    }

    // Enrich favorites with entity details
    const enrichedFavorites = await Promise.all(
      (favorites || []).map(async (fav) => {
        if (fav.entity_type === 'university') {
          const { data: university } = await supabase
            .from('universities')
            .select('id, name_en, name_cn, city, province, type, logo_url, ranking_national')
            .eq('id', fav.entity_id)
            .single();
          return { ...fav, entity: university };
        } else if (fav.entity_type === 'program') {
          const { data: program } = await supabase
            .from('programs')
            .select(`
              id,
              name_en,
              name_cn,
              degree_type,
              tuition_per_year,
              tuition_currency,
              universities (
                id,
                name_en,
                city,
                logo_url
              )
            `)
            .eq('id', fav.entity_id)
            .single();
          return { ...fav, entity: program };
        }
        return fav;
      })
    );

    return NextResponse.json({ 
      favorites: enrichedFavorites,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in favorites GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/student/favorites - Add a favorite
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { entity_id, entity_type } = body;

    if (!entity_id || !entity_type) {
      return NextResponse.json(
        { error: 'Entity ID and entity type are required' },
        { status: 400 }
      );
    }

    if (!['university', 'program'].includes(entity_type)) {
      return NextResponse.json(
        { error: 'Invalid entity type. Must be "university" or "program"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Verify entity exists
    const table = entity_type === 'university' ? 'universities' : 'programs';
    const { data: entity } = await supabase
      .from(table)
      .select('id')
      .eq('id', entity_id)
      .single();

    if (!entity) {
      return NextResponse.json({ error: `${entity_type} not found` }, { status: 404 });
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('entity_id', entity_id)
      .eq('entity_type', entity_type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        error: 'Already favorited',
        favorite: existing 
      }, { status: 400 });
    }

    const { data: favorite, error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        entity_id,
        entity_type,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding favorite:', error);
      return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      favorite,
      message: 'Added to favorites'
    }, { status: 201 });

  } catch (error) {
    console.error('Error in favorites POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/student/favorites - Remove a favorite
export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyAuthToken(request);
    if (!user || user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entity_id');
    const entityType = searchParams.get('entity_type');

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'Entity ID and entity type are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('entity_id', entityId)
      .eq('entity_type', entityType);

    if (error) {
      console.error('Error removing favorite:', error);
      return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Removed from favorites' 
    });

  } catch (error) {
    console.error('Error in favorites DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
