import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Use anon key client for auth verification
    const supabase = getSupabaseClient(token);

    // Get current user - must pass JWT explicitly since persistSession is false
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Use service role client for database operations (bypasses RLS)
    const adminClient = getSupabaseClient();
    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    const user = {
      id: authUser.id,
      email: authUser.email!,
      role: profile?.role || authUser.user_metadata?.role || 'student',
      full_name: profile?.full_name || authUser.user_metadata?.full_name || 'User',
      avatar_url: profile?.avatar_url,
      partner_id: profile?.partner_id,
      partner_role: profile?.partner_role,
      approval_status: profile?.approval_status || 'approved',
      rejection_reason: profile?.rejection_reason,
    };

    console.log('=== /api/auth/me ===');
    console.log('authUser.user_metadata:', authUser.user_metadata);
    console.log('profile from users table:', profile);
    console.log('Returning user:', { id: user.id, email: user.email, role: user.role, partner_id: user.partner_id });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
