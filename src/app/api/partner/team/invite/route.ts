import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  requirePartnerAdmin, 
  getPartnerAdminId, 
  logPartnerTeamActivity,
  type PartnerRole 
} from '@/lib/partner-auth-utils';
import { sendEmail } from '@/lib/email';

interface InviteMemberRequest {
  email: string;
  full_name?: string;
  partner_role: PartnerRole;
  password?: string; // Optional password to create user directly
}

export async function POST(request: NextRequest) {
  try {
    // Verify partner admin authentication
    const authResult = await requirePartnerAdmin(request);
    if ('error' in authResult) {
      return authResult.error;
    }
    
    const partnerUser = authResult.user;
    const partnerAdminId = await getPartnerAdminId(partnerUser.id);
    
    if (!partnerAdminId) {
      return NextResponse.json(
        { error: 'Failed to determine partner admin ID' },
        { status: 500 }
      );
    }
    
    // Parse request body
    const body: InviteMemberRequest = await request.json();
    const { email, full_name, partner_role, password } = body;
    
    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }
    
    if (!partner_role || !['partner_admin', 'member'].includes(partner_role)) {
      return NextResponse.json(
        { error: 'Valid partner_role is required (partner_admin or member)' },
        { status: 400 }
      );
    }
    
    if (password && password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Check if user already exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role, partner_id, full_name, approval_status')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      // User exists - check if they're already in the team
      if (existingUser.partner_id === partnerAdminId) {
        return NextResponse.json(
          { error: 'User is already in your team' },
          { status: 409 }
        );
      }
      
      // Check if user belongs to another partner's team
      if (existingUser.partner_id && existingUser.partner_id !== partnerAdminId) {
        return NextResponse.json(
          { error: 'User belongs to another partner team' },
          { status: 409 }
        );
      }
      
      // User exists but isn't in a team - add them
      const updatePayload: Record<string, unknown> = {
        role: 'partner',
        partner_role: partner_role,
        partner_id: partnerAdminId,
        full_name: full_name || existingUser.full_name,
        is_active: true,
      };

      // Also approve if they were pending
      if (existingUser.approval_status === 'pending') {
        updatePayload.approval_status = 'approved';
      }

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', existingUser.id)
        .select('id, email, full_name, partner_role, partner_id')
        .single();
      
      if (updateError) {
        console.error('Error updating existing user:', updateError);
        return NextResponse.json(
          { error: 'Failed to add user to team' },
          { status: 500 }
        );
      }
      
      // If password provided, also update their auth password
      if (password) {
        const { error: updatePassError } = await supabase.auth.admin.updateUserById(
          existingUser.id,
          { password }
        );
        if (updatePassError) {
          console.error('Error updating user password:', updatePassError);
          // Non-fatal — user is already added to team
        }
      }
      
      // Log the activity
      await logPartnerTeamActivity(
        partnerAdminId,
        partnerUser.id,
        updatedUser.id,
        'invite',
        { 
          email, 
          full_name: updatedUser.full_name,
          partner_role,
          action: password ? 'added_existing_user_with_password' : 'added_existing_user'
        },
        request
      );
      
      // Send notification email (they already have an account)
      await sendTeamAddedEmail(email, updatedUser.full_name || email, partnerUser.full_name || partnerUser.email);
      
      return NextResponse.json({
        success: true,
        message: password ? 'User added to team with new password' : 'User added to team successfully',
        data: updatedUser
      });
    }
    
    // User doesn't exist in users table - create new user
    let newUser;

    if (password) {
      // ============================================
      // FLOW A: Create user with email + password
      // ============================================
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Skip email verification
        user_metadata: {
          full_name: full_name || email.split('@')[0],
          role: 'partner',
        }
      });
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        // Check for duplicate auth user
        if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
          return NextResponse.json(
            { error: 'A user with this email already has an account. Try adding them as an existing user instead.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to create user account' },
          { status: 500 }
        );
      }
      
      // Create user profile in users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: full_name || email.split('@')[0],
          role: 'partner',
          partner_role: partner_role,
          partner_id: partnerAdminId,
          approval_status: 'approved', // Auto-approve partner team members
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, email, full_name, partner_role, partner_id')
        .single();
      
      if (profileError) {
        console.error('Error creating user profile:', profileError);
        // Attempt cleanup: delete the auth user since profile creation failed
        await supabase.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
      
      newUser = profileData;

      // Log the activity
      await logPartnerTeamActivity(
        partnerAdminId,
        partnerUser.id,
        newUser.id,
        'invite',
        { 
          email, 
          full_name: newUser.full_name,
          partner_role,
          action: 'created_user_with_password'
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: 'Team member created successfully. They can now log in with the provided email and password.',
        data: newUser
      });

    } else {
      // ============================================
      // FLOW B: Invite user by email (no password)
      // Uses Supabase admin.inviteUserByEmail() which:
      // 1. Creates a Supabase Auth account
      // 2. Sends a confirmation email with a magic link
      // 3. User clicks link → sets their own password
      // ============================================
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        email,
        {
          data: {
            full_name: full_name || email.split('@')[0],
            role: 'partner',
          },
          redirectTo: undefined, // Let Supabase use its default redirect
        }
      );
      
      if (inviteError) {
        console.error('Error sending invitation:', inviteError);
        // Check for duplicate auth user
        if (inviteError.message?.includes('already been registered') || inviteError.message?.includes('already exists')) {
          return NextResponse.json(
            { error: 'A user with this email already has an account. Try adding them as an existing user instead.' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to send invitation email' },
          { status: 500 }
        );
      }

      // Create user profile in users table, linked to the auth account
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: inviteData.user.id,
          email,
          full_name: full_name || email.split('@')[0],
          role: 'partner',
          partner_role: partner_role,
          partner_id: partnerAdminId,
          approval_status: 'approved', // Auto-approve partner team members
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id, email, full_name, partner_role, partner_id')
        .single();
      
      if (profileError) {
        console.error('Error creating invited user profile:', profileError);
        // Non-fatal: the auth account exists and the user can still accept the invite.
        // We'll try to create the profile when they first log in via /api/auth/me
      }
      
      newUser = profileData || {
        id: inviteData.user.id,
        email,
        full_name: full_name || email.split('@')[0],
        partner_role,
        partner_id: partnerAdminId,
      };

      // Also send a custom team invitation email
      await sendTeamInvitationEmail(email, newUser.full_name || email, partnerUser.full_name || partnerUser.email);

      // Log the activity
      await logPartnerTeamActivity(
        partnerAdminId,
        partnerUser.id,
        newUser.id,
        'invite',
        { 
          email, 
          full_name: newUser.full_name,
          partner_role,
          action: 'sent_email_invitation'
        },
        request
      );

      return NextResponse.json({
        success: true,
        message: 'Invitation sent successfully. The team member will receive an email to set up their account.',
        data: newUser
      });
    }
  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

/**
 * Email sent when a brand-new user is invited (no account exists yet).
 * Supabase sends its own confirmation email with a magic link,
 * so this is a supplementary "welcome" email from the partner.
 */
async function sendTeamInvitationEmail(
  toEmail: string,
  toName: string,
  inviterName: string
) {
  const projectDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  const loginUrl = projectDomain ? `https://${projectDomain}/login` : '/login';
  
  const subject = `You've been invited to join ${inviterName}'s team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Team Invitation</h2>
      <p>Hi ${toName},</p>
      <p><strong>${inviterName}</strong> has invited you to join their partner team on Study in China Academy.</p>
      <p>You'll receive a separate email from Supabase to set up your account password. Once you've set your password, you can log in below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Go to Login
        </a>
      </p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      <p>Best regards,<br>The Study in China Academy Team</p>
    </div>
  `;
  
  await sendEmail({
    to: toEmail,
    subject,
    html
  });
}

/**
 * Email sent when an existing user is added to a partner team.
 */
async function sendTeamAddedEmail(
  toEmail: string,
  toName: string,
  adderName: string
) {
  const projectDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  const loginUrl = projectDomain ? `https://${projectDomain}/login` : '/login';
  
  const subject = `You've been added to ${adderName}'s partner team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Added to Partner Team</h2>
      <p>Hi ${toName},</p>
      <p><strong>${adderName}</strong> has added you to their partner team on Study in China Academy.</p>
      <p>You can now access the partner portal:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${loginUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Go to Partner Portal
        </a>
      </p>
      <p>If you didn't expect this, please contact the partner admin or our support team.</p>
      <p>Best regards,<br>The Study in China Academy Team</p>
    </div>
  `;
  
  await sendEmail({
    to: toEmail,
    subject,
    html
  });
}
