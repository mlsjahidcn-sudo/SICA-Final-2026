/**
 * Admin Payments API
 * GET  /api/admin/payments?student_id=xxx&partner_id=xxx&status=xxx  - List all payments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id');
    const partner_id = searchParams.get('partner_id');
    const status = searchParams.get('status');

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

    let query = supabase
      .from('application_payments')
      .select(`
        *,
        partners(id, company_name, contact_name)
      `)
      .order('created_at', { ascending: false });

    if (student_id) {
      query = query.eq('student_id', student_id);
    }
    if (partner_id) {
      query = query.eq('partner_id', partner_id);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, payments: data || [] });
  } catch (err: unknown) {
    console.error('Admin payments GET error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
