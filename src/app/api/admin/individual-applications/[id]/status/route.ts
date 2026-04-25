import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * POST /api/admin/individual-applications/[id]/status
 * Admin updates the status of an individual (self-registered) student application.
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
    const { status } = body || {};

    // Validate status value
    const validStatuses = [
      'draft',
      'in_progress',
      'submitted_to_university',
      'passed_initial_review',
      'pre_admitted',
      'admitted',
      'jw202_released',
      'rejected',
      'withdrawn',
    ];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value', valid_statuses: validStatuses },
        { status: 400 }
      );
    }

    // Fetch the current application
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('applications')
      .select('id, status, student_id, partner_id, programs(name)')
      .eq('id', appId)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Ensure this is an individual application (no partner)
    if (app.partner_id) {
      return NextResponse.json(
        { error: 'This endpoint is for individual applications only' },
        { status: 403 }
      );
    }

    // Check if the application is in a final state (cannot be changed)
    const finalStatuses = ['jw202_released', 'rejected', 'withdrawn'];
    if (finalStatuses.includes(app.status)) {
      return NextResponse.json(
        { error: `Cannot change status of an application in "${app.status}" state` },
        { status: 409 }
      );
    }

    // Update status
    const { error: updateError } = await supabaseAdmin
      .from('applications')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appId);

    if (updateError) {
      console.error('Error updating application status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update status', details: { message: updateError.message } },
        { status: 500 }
      );
    }

    console.log(`Individual Application ${appId} status changed to "${status}" by admin ${adminUser.id}`);

    return NextResponse.json({
      success: true,
      message: `Status changed to ${status.replace(/_/g, ' ')}`,
      application_id: appId,
      new_status: status,
    });
  } catch (error) {
    console.error('Error in update individual application status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}