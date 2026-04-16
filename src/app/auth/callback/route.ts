import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseCredentials } from '@/storage/database/supabase-client';
import { createClient } from '@supabase/supabase-js';

/**
 * Auth callback handler for Supabase auth flows:
 * - Email confirmation (signup)
 * - Invitation acceptance (partner team invite)
 * - Password reset
 * - Magic link login
 * 
 * Supabase redirects here with a token hash in the URL.
 * We exchange the token for a session and redirect the user.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') || '/login';

  // For token_hash based flows (invite, confirmation, recovery)
  const authCode = code || tokenHash;

  if (authCode) {
    try {
      const { url, anonKey } = getSupabaseCredentials();
      const supabase = createClient(url, anonKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(authCode);

      if (error) {
        console.error('Auth callback exchange error:', error.message);
        // Redirect to login with error
        const redirectUrl = new URL('/login', requestUrl.origin);
        redirectUrl.searchParams.set('error', 'auth_callback_failed');
        redirectUrl.searchParams.set('error_description', error.message);
        return NextResponse.redirect(redirectUrl);
      }

      if (data.session) {
        // Determine redirect based on auth type
        let redirectTo = '/login';

        // For password recovery, redirect to reset-password page
        if (type === 'recovery') {
          redirectTo = '/reset-password';
        } else {
          // For other flows — determine redirect based on user role
          const userRole = data.user?.user_metadata?.role || 'student';
          const approvalStatus = data.user?.user_metadata?.approval_status || 'approved';
          
          // For invite flow — the user just confirmed their email and got a session
          // Redirect them to the appropriate portal
          if (userRole === 'partner') {
            if (approvalStatus === 'approved') {
              redirectTo = '/partner-v2';
            } else {
              redirectTo = '/login'; // They'll see the approval pending screen after login
            }
          } else if (userRole === 'admin') {
            redirectTo = '/admin/v2';
          } else {
            redirectTo = '/student-v2';
          }
        }

        const redirectUrl = new URL(redirectTo, requestUrl.origin);
        
        // Set session cookies on the redirect response
        const response = NextResponse.redirect(redirectUrl);
        
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieOptions = {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax' as const,
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        };

        response.cookies.set('sb-access-token', data.session.access_token, cookieOptions);
        response.cookies.set('sb-refresh-token', data.session.refresh_token, cookieOptions);
        response.cookies.set('user-role', userRole, {
          httpOnly: false,
          secure: isProduction,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        });

        // Also store in localStorage via a small HTML page
        // (cookies are set above, the login page will use them)
        return response;
      }
    } catch (err) {
      console.error('Auth callback error:', err);
    }
  }

  // Fallback: redirect to login
  const redirectUrl = new URL('/login', requestUrl.origin);
  if (type === 'invite') {
    redirectUrl.searchParams.set('invited', 'true');
  }
  return NextResponse.redirect(redirectUrl);
}
