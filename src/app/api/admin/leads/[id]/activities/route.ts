import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAdmin } from '@/lib/auth-utils';

// GET /api/admin/leads/[id]/activities - Get all activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const { id } = await params;
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('lead_activities')
      .select(`
        id,
        lead_id,
        user_id,
        activity_type,
        content,
        created_at,
        users (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead activities:', error);
      return NextResponse.json({ error: 'Failed to fetch activities', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Lead activities GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/admin/leads/[id]/activities - Create a new activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if (adminCheck instanceof NextResponse) {
      return adminCheck;
    }

    const user = adminCheck;
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('lead_activities')
      .insert({
        lead_id: id,
        user_id: user.id,
        activity_type: body.activity_type || 'note',
        content: body.content,
      })
      .select(`
        id,
        lead_id,
        user_id,
        activity_type,
        content,
        created_at,
        users (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating lead activity:', error);
      return NextResponse.json({ error: 'Failed to create activity', details: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Lead activity POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
