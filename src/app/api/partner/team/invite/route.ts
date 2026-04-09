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
    
    if (password && password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email, role, partner_id, full_name')
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
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'partner',
          partner_role: partner_role,
          partner_id: partnerAdminId,
          full_name: full_name || existingUser.full_name,
          is_active: true, // If user exists, activate them
        })
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
          action: password ? 'created_user_with_password' : 'added_existing_user'
        },
        request
      );
      
      // If password not provided, send invitation email; otherwise, no email needed
      if (!password) {
        await sendTeamInvitationEmail(email, updatedUser.full_name || email, partnerUser.full_name || partnerUser.email);
      }
      
      return NextResponse.json({
        success: true,
        message: password ? 'User created and added to team successfully' : 'User added to team successfully',
        data: updatedUser
      });
    }
    
    // User doesn't exist - create new user
    let newUser;
    
    if (password) {
      // Create user with password directly using service role
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
        return NextResponse.json(
          { error: 'Failed to create user' },
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
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
      
      newUser = profileData;
    } else {
      // Create user with invitation (no password)
      const { data: inviteUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          full_name: full_name || email.split('@')[0],
          role: 'partner',
          partner_role: partner_role,
          partner_id: partnerAdminId,
          is_active: false // Mark as inactive until they accept invite
        })
        .select('id, email, full_name, partner_role, partner_id')
        .single();
      
      if (createError) {
        console.error('Error creating new user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user invitation' },
          { status: 500 }
        );
      }
      
      newUser = inviteUser;
    }
    
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
        action: password ? 'created_user_with_password' : 'created_new_user'
      },
      request
    );
    
    // Send invitation email only if no password was provided
    if (!password) {
      await sendTeamInvitationEmail(email, newUser.full_name, partnerUser.full_name || partnerUser.email);
    }
    
    return NextResponse.json({
      success: true,
      message: password ? 'User created and added to team successfully' : 'Invitation sent successfully',
      data: newUser
    });
  } catch (error) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

async function sendTeamInvitationEmail(
  toEmail: string,
  toName: string,
  inviterName: string
) {
  const projectDomain = process.env.COZE_PROJECT_DOMAIN_DEFAULT;
  const signupUrl = projectDomain ? `https://${projectDomain}/auth/signup` : '/auth/signup';
  
  const subject = `You've been invited to join ${inviterName}'s team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Team Invitation</h2>
      <p>Hi ${toName},</p>
      <p>${inviterName} has invited you to join their partner team on Study in China Academy.</p>
      <p>Click the button below to accept the invitation and create your account:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${signupUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
          Accept Invitation
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
