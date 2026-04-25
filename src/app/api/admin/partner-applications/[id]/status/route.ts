import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

/**
 * POST /api/admin/partner-applications/[id]/status
 * Admin updates the status of a partner application.
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
      .select('id, status, student_id, programs(name)')
      .eq('id', appId)
      .single();

    if (fetchError || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if the application is in a final state (cannot be changed)
    const finalStatuses = ['jw202_released', 'rejected', 'withdrawn'];
    if (finalStatuses.includes(app.status)) {
      return NextResponse.json(
        { error: `Cannot change status of an application in "${app.status}" state` },
        { status: 409 }
      );
    }

    // Prevent going backwards in status flow (optional business logic)
    const statusOrder = [
      'draft',
      'in_progress',
      'submitted_to_university',
      'passed_initial_review',
      'pre_admitted',
      'admitted',
      'jw202_released',
    ];
    
    const currentIdx = statusOrder.indexOf(app.status);
    const newIdx = statusOrder.indexOf(status);
    
    // Allow forward progress, but not backward (unless rejecting or withdrawing)
    if (newIdx > currentIdx && currentIdx !== -1 && newIdx !== -1) {
      // Forward progress is allowed
    } else if (status === 'rejected' || status === 'withdrawn') {
      // Rejection and withdrawal are always allowed from non-final states
    } else if (newIdx < currentIdx && currentIdx !== -1) {
      // Going backwards - this is allowed for flexibility in case of mistakes
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

    console.log(`Application ${appId} status changed to "${status}" by admin ${adminUser.id}`);

    return NextResponse.json({
      success: true,
      message: `Status changed to ${status.replace(/_/g, ' ')}`,
      application_id: appId,
      new_status: status,
    });
  } catch (error) {
    console.error('Error in update application status:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}