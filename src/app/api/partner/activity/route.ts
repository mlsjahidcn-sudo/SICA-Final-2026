import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';

// GET /api/partner/activity - Get activity logs for a specific entity
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Fetch activity logs
    const { data: logs, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (error) {
      console.error('Error fetching activity logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activity logs' },
        { status: 500 }
      );
    }

    // Check if there are more logs
    const { count } = await supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    return NextResponse.json({
      logs: logs || [],
      hasMore: (count || 0) > offset + limit,
    });
  } catch (error) {
    console.error('Error in partner activity GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/partner/activity - Log a new activity
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;

    const body = await request.json();
    const { entityType, entityId, action, metadata } = body;

    if (!entityType || !entityId || !action) {
      return NextResponse.json(
        { error: 'entityType, entityId, and action are required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get actor info
    const { data: actor } = await supabase
      .from('users')
      .select('full_name, role')
      .eq('id', authResult.user.id)
      .maybeSingle();

    // Insert activity log
    const { data: log, error } = await supabase
      .from('activity_log')
      .insert({
        entity_type: entityType,
        entity_id: entityId,
        action,
        actor_id: authResult.user.id,
        actor_name: actor?.full_name || null,
        actor_role: actor?.role || null,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting activity log:', error);
      return NextResponse.json(
        { error: 'Failed to log activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ log });
  } catch (error) {
    console.error('Error in partner activity POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
