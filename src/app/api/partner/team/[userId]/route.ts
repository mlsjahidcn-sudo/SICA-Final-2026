import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { 
  requirePartnerAdmin, 
  getPartnerAdminId, 
  isUserInPartnerTeam,
  logPartnerTeamActivity,
  type PartnerRole 
} from '@/lib/partner-auth-utils';

interface UpdateMemberRequest {
  partner_role?: PartnerRole;
  full_name?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
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
    
    // Verify target user is in partner's team
    const isInTeam = await isUserInPartnerTeam(partnerAdminId, userId);
    if (!isInTeam) {
      return NextResponse.json(
        { error: 'User not found in your team' },
        { status: 404 }
      );
    }
    
    // Don't allow updating yourself (to prevent locking yourself out)
    if (userId === partnerUser.id) {
      return NextResponse.json(
        { error: 'Cannot update your own role' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body: UpdateMemberRequest = await request.json();
    const { partner_role, full_name } = body;
    
    // Validate input
    const updateData: Record<string, unknown> = {};
    
    if (partner_role !== undefined) {
      if (!['partner_admin', 'member'].includes(partner_role)) {
        return NextResponse.json(
          { error: 'Invalid partner_role (must be partner_admin or member)' },
          { status: 400 }
        );
      }
      updateData.partner_role = partner_role;
    }
    
    if (full_name !== undefined) {
      updateData.full_name = full_name;
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Get previous role for logging
    const previousRole = await getPreviousRole(userId);
    
    // Update the user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select('id, email, full_name, partner_role, partner_id')
      .single();
    
    if (updateError) {
      console.error('Error updating team member:', updateError);
      return NextResponse.json(
        { error: 'Failed to update team member' },
        { status: 500 }
      );
    }
    
    // Log the activity
    await logPartnerTeamActivity(
      partnerAdminId,
      partnerUser.id,
      userId,
      'update_role',
      { 
        ...updateData,
        previous_role: previousRole
      },
      request
    );
    
    return NextResponse.json({
      success: true,
      message: 'Team member updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
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
    
    // Verify target user is in partner's team
    const isInTeam = await isUserInPartnerTeam(partnerAdminId, userId);
    if (!isInTeam) {
      return NextResponse.json(
        { error: 'User not found in your team' },
        { status: 404 }
      );
    }
    
    // Don't allow deleting yourself
    if (userId === partnerUser.id) {
      return NextResponse.json(
        { error: 'Cannot remove yourself from the team' },
        { status: 403 }
      );
    }
    
    const supabase = getSupabaseClient();
    
    // Get user data before deletion for logging
    const { data: userToRemove } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('id', userId)
      .single();
    
    // Remove the user from the team (don't delete the user, just unlink)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        partner_id: null,
        partner_role: null,
        role: 'student' // Change back to student
      })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error removing team member:', updateError);
      return NextResponse.json(
        { error: 'Failed to remove team member' },
        { status: 500 }
      );
    }
    
    // Log the activity
    await logPartnerTeamActivity(
      partnerAdminId,
      partnerUser.id,
      userId,
      'remove',
      { 
        email: userToRemove?.email,
        full_name: userToRemove?.full_name
      },
      request
    );
    
    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: 'Failed to remove team member' },
      { status: 500 }
    );
  }
}

async function getPreviousRole(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  const { data } = await supabase
    .from('users')
    .select('partner_role')
    .eq('id', userId)
    .single();
  
  return data?.partner_role || null;
}
