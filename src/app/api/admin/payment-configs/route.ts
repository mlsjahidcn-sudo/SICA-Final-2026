/**
 * Admin Payment Configs API
 * GET  /api/admin/payment-configs?student_id=xxx  - Get config for a student
 * POST /api/admin/payment-configs                  - Set/update config
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');

    if (!student_id) {
      return NextResponse.json({ error: 'student_id required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .eq('student_id', student_id)
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
      student_id,
      deposit_amount,
      deposit_currency,
      service_fee_amount,
      service_fee_currency,
    } = body;

    if (!student_id) {
      return NextResponse.json({ error: 'student_id required' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        student_id,
        deposit_amount,
        deposit_currency: deposit_currency || 'USD',
        service_fee_amount,
        service_fee_currency: service_fee_currency || 'USD',
        created_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'student_id' })
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
