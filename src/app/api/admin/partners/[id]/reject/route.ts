import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-utils';

// POST - Reject a partner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin(request);
    if (user instanceof NextResponse) return user;

    const { id: partnerId } = await params;
    const supabase = getSupabaseClient();

    // Get rejection reason from request body
    const body = await request.json();
    const rejectionReason = body.reason || 'Application rejected by administrator';

    // Update user approval status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        approval_status: 'rejected',
        rejection_reason: rejectionReason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerId)
      .eq('role', 'partner');

    if (updateError) {
      console.error('Error rejecting partner:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Also update the partners table status if a record exists
    await supabase
      .from('partners')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('user_id', partnerId);

    return NextResponse.json({ 
      success: true,
      message: 'Partner rejected' 
    });
  } catch (error) {
    console.error('Reject partner error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
