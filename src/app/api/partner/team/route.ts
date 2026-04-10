import { NextRequest, NextResponse } from 'next/server';
import { verifyPartnerAuth, getPartnerAdminId, getPartnerTeamMembers } from '@/lib/partner-auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Verify partner authentication (both admin and member can view team)
    const authResult = await verifyPartnerAuth(request);
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
    
    // Get team members
    const teamMembers = await getPartnerTeamMembers(partnerAdminId);
    
    return NextResponse.json({
      success: true,
      data: teamMembers
    });
  } catch (error) {
    console.error('Error fetching partner team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}
