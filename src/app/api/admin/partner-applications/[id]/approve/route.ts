import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * POST /api/admin/partner-applications/[id]/approve
 * Admin approves a partner application.
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
    const { notes } = body || {};

    // Fetch the current application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, student_id, programs(name)')
      .eq('id', appId)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if already approved or rejected
    if (app.status === 'accepted') {
      return NextResponse.json(
        { error: 'This application has already been approved' },
        { status: 409 }
      );
    }

    if (app.status === 'rejected') {
      return NextResponse.json(
        { error: 'This application was previously rejected. Please contact support to re-evaluate.' },
        { status: 409 }
      );
    }

    // Update status to accepted
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status: 'accepted',
        approved_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        reviewed_at: new Date().toISOString(),
        ...(notes && { admin_notes: notes }),
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId);

    if (updateError) {
      console.error('Error approving application:', updateError);
      return NextResponse.json(
        { error: 'Failed to approve application', details: { message: updateError.message } },
        { status: 500 }
      );
    }

    console.log(`Application ${appId} approved by admin ${adminUser.id}. Notes: ${notes || 'none'}`);

    return NextResponse.json({
      success: true,
      message: 'Application approved successfully',
      application_id: appId,
      new_status: 'accepted',
    });
  } catch (error) {
    console.error('Error in approve application:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
