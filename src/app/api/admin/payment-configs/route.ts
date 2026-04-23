/**
 * Admin Payment Configs API
 * GET  /api/admin/payment-configs?application_id=xxx  - Get config for an app
 * POST /api/admin/payment-configs                       - Set/update config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const application_id = searchParams.get('application_id');

    if (!application_id) {
      return NextResponse.json({ error: 'application_id required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('app_payment_configs')
      .select('*')
      .eq('application_id', application_id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching payment config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: data });
  } catch (err: unknown) {
    console.error('Admin payment-configs GET error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      application_id,
      deposit_amount,
      deposit_currency,
      service_fee_amount,
      service_fee_currency,
    } = body;

    if (!application_id) {
      return NextResponse.json({ error: 'application_id required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('app_payment_configs')
      .upsert({
        application_id,
        deposit_amount,
        deposit_currency: deposit_currency || 'USD',
        service_fee_amount,
        service_fee_currency: service_fee_currency || 'USD',
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'application_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting payment config:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: data });
  } catch (err: unknown) {
    console.error('Admin payment-configs POST error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
