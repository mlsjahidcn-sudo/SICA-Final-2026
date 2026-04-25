import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Pagination params
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filter params
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const assignee_id = searchParams.get('assignee_id');
    const search = searchParams.get('search');

    // Build count query
    let countQuery = supabase
      .from('leads')
      .select('id', { count: 'exact', head: true });

    // Build data query
    let dataQuery = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (type) {
      countQuery = countQuery.eq('type', type);
      dataQuery = dataQuery.eq('type', type);
    }

    if (status) {
      countQuery = countQuery.eq('status', status);
      dataQuery = dataQuery.eq('status', status);
    }

    if (source) {
      countQuery = countQuery.eq('source', source);
      dataQuery = dataQuery.eq('source', source);
    }

    if (assignee_id) {
      countQuery = countQuery.eq('assignee_id', assignee_id);
      dataQuery = dataQuery.eq('assignee_id', assignee_id);
    }

    if (search) {
      const searchFilter = `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,organization_name.ilike.%${search}%`;
      countQuery = countQuery.or(searchFilter);
      dataQuery = dataQuery.or(searchFilter);
    }

    // Get count first
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting leads:', countError);
      return NextResponse.json({ error: 'Failed to count leads', details: countError.message }, { status: 500 });
    }

    // Get paginated data
    const { data, error } = await dataQuery.range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads', details: error.message }, { status: 500 });
    }

    return NextResponse.json({
      leads: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Leads GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const body = await request.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...body,
        status: body.status || 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lead:', error);
      return NextResponse.json({ error: 'Failed to create lead', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Leads POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
