/**
 * Partner Payments API
 * GET  /api/partner/payments?application_id=xxx  - List payments for my apps
 * POST /api/partner/payments                      - Record a new payment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const application_id = searchParams.get('application_id');

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner record for this user
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 403 });
    }

    let query = supabase
      .from('application_payments')
      .select(`
        *,
        applications!inner(id, student_id)
      `)
      .eq('partner_id', partner.id);

    if (application_id) {
      query = query.eq('application_id', application_id);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payments: data || [] });
  } catch (err: unknown) {
    console.error('Partner payments GET error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { application_id, payment_type, amount, currency, payment_date, notes, receipt_url } = body;

    if (!application_id || !payment_type || !amount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get partner record for this user
    const { data: partner } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 403 });
    }

    // Verify this application belongs to this partner
    const { data: app } = await supabase
      .from('applications')
      .select('id, partner_id')
      .eq('id', application_id)
      .single();

    if (!app || app.partner_id !== partner.id) {
      return NextResponse.json({ error: 'Application not found or access denied' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('application_payments')
      .insert({
        application_id,
        partner_id: partner.id,
        payment_type,
        amount,
        currency: currency || 'USD',
        payment_date: payment_date || new Date().toISOString().split('T')[0],
        status: 'received',
        notes,
        receipt_url,
        recorded_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating payment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payment: data });
  } catch (err: unknown) {
    console.error('Partner payments POST error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
