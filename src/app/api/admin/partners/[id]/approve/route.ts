import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// POST - Approve a partner user
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: partnerUserId } = await params;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    const supabase = getSupabaseClient(token);

    // Verify admin role
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

    // Update user approval status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        approval_status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: authUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', partnerUserId)
      .eq('role', 'partner');

    if (updateError) {
      console.error('Error approving partner:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Also update the partners table status if a record exists
    await supabase
      .from('partners')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('user_id', partnerUserId);

    return NextResponse.json({ 
      success: true,
      message: 'Partner approved successfully' 
    });
  } catch (error) {
    console.error('Approve partner error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
