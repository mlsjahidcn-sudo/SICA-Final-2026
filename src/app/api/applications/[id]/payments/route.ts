/**
 * Application Payments Summary API
 * GET /api/applications/[id]/payments
 * Returns payment config + all payment records for an application
 * Accessible by both partner (own apps) and admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = getSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    if (!isAdmin) {
      // Partner: verify they own this application
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!partner) {
        return NextResponse.json({ error: 'Partner not found' }, { status: 403 });
      }

      const { data: app } = await supabase
        .from('applications')
        .select('id, partner_id')
        .eq('id', id)
        .single();

      if (!app || app.partner_id !== partner.id) {
        return NextResponse.json({ error: 'Application not found or access denied' }, { status: 403 });
      }
    }

    // Fetch payment config
    const { data: config } = await supabase
      .from('app_payment_configs')
      .select('*')
      .eq('application_id', id)
      .maybeSingle();

    // Fetch payment records
    const { data: payments, error: paymentsError } = await supabase
      .from('application_payments')
      .select('*')
      .eq('application_id', id)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json({ error: paymentsError.message }, { status: 500 });
    }

    // Build summary
    const depositPayments = (payments || []).filter((p) => p.payment_type === 'deposit');
    const serviceFeePayments = (payments || []).filter((p) => p.payment_type === 'service_fee');

    const depositPaid = depositPayments
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const depositPending = depositPayments
      .filter((p) => p.status === 'received')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const serviceFeePaid = serviceFeePayments
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const serviceFeePending = serviceFeePayments
      .filter((p) => p.status === 'received')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return NextResponse.json({
      success: true,
      config: config || null,
      payments: payments || [],
      summary: {
        deposit: {
          config_amount: config?.deposit_amount || null,
          config_currency: config?.deposit_currency || 'USD',
          total_paid: depositPaid,
          total_pending: depositPending,
          status:
            depositPaid > 0 ? 'confirmed' : depositPending > 0 ? 'received' : 'unpaid',
        },
        service_fee: {
          config_amount: config?.service_fee_amount || null,
          config_currency: config?.service_fee_currency || 'USD',
          total_paid: serviceFeePaid,
          total_pending: serviceFeePending,
          status:
            serviceFeePaid > 0 ? 'confirmed' : serviceFeePending > 0 ? 'received' : 'unpaid',
        },
      },
    });
  } catch (err: unknown) {
    console.error('Application payments GET error:', err);
    const msg = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
