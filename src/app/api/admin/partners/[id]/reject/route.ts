import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - Reject a partner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(token);

    // Verify admin role - must pass JWT explicitly since persistSession is false
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get admin profile
    const { data: adminProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    if (adminProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

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
