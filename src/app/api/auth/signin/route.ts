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

    // If no profile exists yet (e.g., invited user whose profile insert failed),
    // auto-create it using the service role client
    let userProfile = profile;
    if (!userProfile) {
      const adminClient = getSupabaseClient();
      const metaRole = authData.user.user_metadata?.role || 'student';
      const metaName = authData.user.user_metadata?.full_name || email.split('@')[0];
      
      const { data: newProfile, error: createError } = await adminClient
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: metaName,
          role: metaRole,
          partner_id: authData.user.user_metadata?.partner_id || null,
          partner_role: authData.user.user_metadata?.partner_role || null,
          approval_status: 'approved',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (createError) {
        console.error('Error auto-creating user profile on signin:', createError);
        // Non-fatal — continue with auth metadata fallback
      } else {
        userProfile = newProfile;
      }
    }

    const user = {
      id: authData.user.id,
      email: authData.user.email!,
      role: userProfile?.role || authData.user.user_metadata?.role || 'student',
      full_name: userProfile?.full_name || authData.user.user_metadata?.full_name || 'User',
      avatar_url: userProfile?.avatar_url,
      partner_id: userProfile?.partner_id,
      partner_role: userProfile?.partner_role,
      approval_status: userProfile?.approval_status || 'approved',
      rejection_reason: userProfile?.rejection_reason,
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
