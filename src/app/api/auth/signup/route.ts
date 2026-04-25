import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient, clearSupabaseClient } from '@/storage/database/supabase-client';
import { sendEmail, logEmail, getWelcomeTemplate } from '@/lib/email';
import { checkEmailExists } from '@/lib/student-validation';
import { createRateLimitMiddleware, rateLimitPresets } from '@/lib/rate-limit';
import { errors } from '@/lib/api-response';

const signupRateLimit = createRateLimitMiddleware(rateLimitPresets.auth);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting to prevent account flooding
    const rateLimitResult = signupRateLimit(request);
    if (!rateLimitResult.allowed) {
      return errors.rateLimit(rateLimitResult.resetTime);
    }

    console.log('[SIGNUP] Starting signup process');
    const { email, password, fullName, role, partnerInfo } = await request.json();
    console.log('[SIGNUP] Request data:', { email, fullName, role });

    if (!email || !password || !fullName || !role) {
      console.error('[SIGNUP] Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['student', 'partner', 'admin'].includes(role)) {
      console.error('[SIGNUP] Invalid role:', role);
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check if user already exists (before creating auth user)
    console.log('[SIGNUP] Checking if email exists');
    const emailCheck = await checkEmailExists(email);
    console.log('[SIGNUP] Email check result:', emailCheck);
    
    if (emailCheck.exists) {
      console.error('[SIGNUP] Email already exists');
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    console.log('[SIGNUP] Getting Supabase client');
    // Clear any cached client to ensure we use service role key
    clearSupabaseClient();
    const supabase = getSupabaseClient();
    console.log('[SIGNUP] Supabase client obtained with service role key');

    // Create auth user with metadata - disable Supabase's default verification email
    console.log('[SIGNUP] Creating auth user');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
          partner_role: role === 'partner' ? 'partner_admin' : undefined,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/login`,
      },
    });

    if (authError) {
      console.error('[SIGNUP] Auth error:', authError);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      console.error('[SIGNUP] No user data returned');
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    console.log('[SIGNUP] User created successfully:', authData.user.id);

    // Create user profile in users table
    // Partners require admin approval, others are auto-approved
    console.log('[SIGNUP] Creating user profile in users table');
    const approvalStatus = role === 'partner' ? 'pending' : 'approved';
    
    const userProfile: Record<string, unknown> = {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: fullName,
      role: role,
      approval_status: approvalStatus,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add partner-specific fields
    if (role === 'partner') {
      // Self-signed-up partners get partner_admin role (they're creating their own org)
      // Their partner_id points to themselves as the org owner
      userProfile.partner_role = 'partner_admin';
      userProfile.partner_id = authData.user.id;

      if (partnerInfo) {
        userProfile.company_name = partnerInfo.companyName || null;
        userProfile.country = partnerInfo.country || null;
        userProfile.city = partnerInfo.city || null;
        userProfile.website = partnerInfo.website || null;
        if (partnerInfo.phone) userProfile.phone = partnerInfo.phone;
      }
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert(userProfile);

    if (profileError) {
      console.error('[SIGNUP] Error creating user profile:', profileError);
      // Continue anyway - profile can be created later
    } else {
      console.log('[SIGNUP] User profile created successfully');
    }

    // Create a record in the students table for student users
    // This ensures data consistency - all students have both users and students records
    if (role === 'student') {
      console.log('[SIGNUP] Creating student record');
      const studentData = {
        user_id: authData.user.id,
        email: authData.user.email,
        // Other fields are left empty - student can fill later
      };
      console.log('[SIGNUP] Student data:', studentData);
      
      const { error: studentError } = await supabase
        .from('students')
        .insert(studentData);

      if (studentError) {
        console.error('[SIGNUP] Error creating student record:', studentError);
        // Non-critical, continue - student record can be created later
      } else {
        console.log('[SIGNUP] Student record created successfully');
      }
    }

    // Also create a record in the partners table for partner users
    if (role === 'partner') {
      const { error: partnerError } = await supabase
        .from('partners')
        .insert({
          user_id: authData.user.id,
          company_name: partnerInfo?.companyName || fullName + "'s Company",
          contact_person: fullName,
          contact_phone: partnerInfo?.phone || null,
          website: partnerInfo?.website || null,
          status: 'pending',
        });

      if (partnerError) {
        console.error('Error creating partner record:', partnerError);
        // Non-critical, continue
      }
    }

    // Send welcome email (async, don't block response)
    (async () => {
      try {
        const emailPayload = getWelcomeTemplate({
          name: fullName,
          email: email,
          role: role,
        });

        const result = await sendEmail(emailPayload);
        
        await logEmail({
          userId: authData.user!.id,
          emailType: 'welcome',
          recipient: email,
          subject: emailPayload.subject,
          status: result.success ? 'sent' : 'failed',
          error: result.error,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }
    })();

    console.log('[SIGNUP] Signup completed successfully');
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: role,
        full_name: fullName,
      },
    });
  } catch (error) {
    console.error('[SIGNUP] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
