import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * GET /api/admin/applications/[id]
 * Fetch basic application info by ID - returns partner_id to help determine application type
 *
 * This is a lightweight endpoint that returns minimal info including partner_id.
 * Frontend should use this to determine if it's an individual or partner application,
 * then call the appropriate detail API.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id } = await params;
    const supabaseAdmin = getSupabaseClient();

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    // Fetch basic application info including partner_id
    const { data: app, error } = await supabaseAdmin
      .from('applications')
      .select(`
        id,
        partner_id,
        status,
        created_at
      `)
      .eq('id', id)
      .single();

    if (error || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: app.id,
      partner_id: app.partner_id,
      status: app.status,
      created_at: app.created_at,
      // Flag to indicate application type
      isIndividual: app.partner_id === null,
    });
  } catch (err) {
    console.error('Error fetching application:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}