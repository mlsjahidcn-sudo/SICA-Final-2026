import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { sendEmail, logEmail, getWelcomeTemplate } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role, partnerInfo } = await request.json();

    if (!email || !password || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['student', 'partner', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Create auth user with metadata - disable Supabase's default verification email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://sica.edu'}/login`,
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile in users table
    // Partners require admin approval, others are auto-approved
    const approvalStatus = role === 'partner' ? 'pending' : 'approved';
    
    const userProfile: Record<string, unknown> = {
      id: authData.user.id,
      email: authData.user.email!,
      full_name: fullName,
      role: role,
      approval_status: approvalStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add partner-specific fields
    if (role === 'partner' && partnerInfo) {
      userProfile.company_name = partnerInfo.companyName || null;
      userProfile.country = partnerInfo.country || null;
      userProfile.city = partnerInfo.city || null;
      userProfile.website = partnerInfo.website || null;
      if (partnerInfo.phone) userProfile.phone = partnerInfo.phone;
    }

    const { error: profileError } = await supabase
      .from('users')
      .insert(userProfile);

    if (profileError) {
      console.error('Error creating user profile:', profileError);
      // Continue anyway - profile can be created later
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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
