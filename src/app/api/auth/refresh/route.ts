import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseCredentials, getSupabaseClient } from '@/storage/database/supabase-client';
import { withTimeout } from '@/lib/api-cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    // Use anon key client to refresh the session (not service role)
    const { url, anonKey } = getSupabaseCredentials();
    const supabase = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Exchange refresh token for new access token with timeout
    const refreshResult = await withTimeout(
      supabase.auth.refreshSession({ refresh_token }),
      5000,
      'Token refresh timed out'
    );

    const { data, error } = refreshResult;

    if (error || !data.session || !data.user) {
      console.error('Token refresh failed:', error?.message);
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Fetch user profile with service role client (with timeout)
    const adminClient = getSupabaseClient();
    const profileResult = await withTimeout(
      adminClient
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle(),
      5000,
      'Profile fetch timed out'
    );
    const { data: profile } = profileResult;

    const user = {
      id: data.user.id,
      email: data.user.email!,
      role: profile?.role || data.user.user_metadata?.role || 'student',
      full_name: profile?.full_name || data.user.user_metadata?.full_name || 'User',
      avatar_url: profile?.avatar_url,
      partner_id: profile?.partner_id,
      partner_role: profile?.partner_role,
      approval_status: profile?.approval_status || 'approved',
      rejection_reason: profile?.rejection_reason,
    };

    // Set new cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    const response = NextResponse.json({
      success: true,
      user,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    });

    response.cookies.set('sb-access-token', data.session.access_token, cookieOptions);
    response.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);
    response.cookies.set('user-role', user.role, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
