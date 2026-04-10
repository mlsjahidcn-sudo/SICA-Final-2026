import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, getSupabaseCredentials } from '@/storage/database/supabase-client';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Use anon key client for auth operations (not service role)
    const { url, anonKey } = getSupabaseCredentials();
    const supabase = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Sign in with email/password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: 'Failed to sign in' },
        { status: 500 }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    const user = {
      id: authData.user.id,
      email: authData.user.email!,
      role: profile?.role || authData.user.user_metadata?.role || 'student',
      full_name: profile?.full_name || authData.user.user_metadata?.full_name || 'User',
      avatar_url: profile?.avatar_url,
      partner_id: profile?.partner_id,
      partner_role: profile?.partner_role,
      approval_status: profile?.approval_status || 'approved',
      rejection_reason: profile?.rejection_reason,
    };

    // Check if partner account is pending approval
    if (user.role === 'partner' && user.approval_status === 'pending') {
      return NextResponse.json({
        success: false,
        error: 'Your partner account is pending approval. You will be notified once an administrator reviews your application.',
        approval_status: 'pending',
      }, { status: 403 });
    }

    // Check if partner account was rejected
    if (user.role === 'partner' && user.approval_status === 'rejected') {
      return NextResponse.json({
        success: false,
        error: `Your partner application was rejected. Reason: ${user.rejection_reason || 'Not specified'}`,
        approval_status: 'rejected',
        rejection_reason: user.rejection_reason,
      }, { status: 403 });
    }

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user,
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
    });

    // Set HTTP-only cookies for middleware authentication
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    // Set auth token cookie
    response.cookies.set('sb-access-token', authData.session.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', authData.session.refresh_token, cookieOptions);
    
    // Set user role cookie for quick access (not sensitive, accessible by JS)
    response.cookies.set('user-role', user.role, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Signin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
