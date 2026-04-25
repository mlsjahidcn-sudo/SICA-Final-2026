import { NextRequest, NextResponse } from 'next/server';
import { verifyPartnerAuth } from '@/lib/partner/roles';
import { getVisibleReferrerIds } from '@/lib/partner/visibility';

/**
 * GET /api/partner/context
 * Returns partner context data for caching in the client
 * - teamMemberIds: IDs of team members (admin sees all, member sees only self)
 * - visibleReferrerIds: IDs of referrers whose students are visible
 */
export async function GET(request: NextRequest) {
  const result = await verifyPartnerAuth(request);
  
  if ('error' in result) {
    return result.error;
  }
  
  const partnerUser = result.user;
  
  // Get visible referrer IDs (this also handles team member IDs internally)
  const visibleReferrerIds = await getVisibleReferrerIds(partnerUser);
  
  // Team member IDs are the same as visible referrer IDs for now
  // (Admin sees all team members, member sees only themselves)
  const teamMemberIds = visibleReferrerIds;
  
  return NextResponse.json({
    success: true,
    data: {
      teamMemberIds,
      visibleReferrerIds,
    },
  });
}
