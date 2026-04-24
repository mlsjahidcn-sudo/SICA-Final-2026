import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * POST /api/admin/partner-applications/[id]/reject
 * Admin rejects a partner application.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await requireAdmin(request);
    if (adminUser instanceof NextResponse) return adminUser;

    const { id: appId } = await params;
    const supabaseAdmin = getSupabaseClient();
    const body = await request.json();
    const { reason, notes } = body || {};

    // Require rejection reason
    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: 'Rejection reason is required (minimum 5 characters)' },
        { status: 400 }
      );
    }

    // Fetch the current application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, student_id, programs(name)')
      .eq('id', appId)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if already decided
    if (app.status === 'rejected') {
      return NextResponse.json(
        { error: 'This application has already been rejected' },
        { status: 409 }
      );
    }

    if (app.status === 'accepted') {
      return NextResponse.json(
        { error: 'This application was previously approved. Contact support to reverse this decision.' },
        { status: 409 }
      );
    }

    // Update status to rejected
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'rejected',
        rejection_reason: reason.trim(),
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        ...(notes && { admin_notes: notes }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId);

    if (updateError) {
      console.error('Error rejecting application:', updateError);
      return NextResponse.json(
        { error: 'Failed to reject application', details: { message: updateError.message } },
        { status: 500 }
      );
    }

    console.log(`Application ${appId} rejected by admin ${adminUser.id}. Reason: ${reason}`);

    return NextResponse.json({
      success: true,
      message: 'Application rejected successfully',
      application_id: appId,
      new_status: 'rejected',
      rejection_reason: reason,
    });
  } catch (error) {
    console.error('Error in reject application:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
