import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';

/**
 * POST /api/partner/applications/bulk
 * Bulk operations on applications (update status, delete)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    const body = await request.json();
    const { action, applicationIds, data } = body;

    if (!action || !applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Verify partner has access to all applications
    const { data: applications, error: fetchError } = await supabase
      .from('applications')
      .select('id, student_id, partner_id, status, students ( user_id, users ( referred_by_partner_id ) )')
      .in('id', applicationIds);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Check access for each application
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    const accessibleIds: string[] = [];

    for (const app of applications || []) {
      // Partner admin can access all applications from their org
      if (isAdmin) {
        // Check if application.partner_id belongs to this partner's org
        if (app.partner_id) {
          const { data: partnerRecords } = await supabase
            .from('partners')
            .select('id')
            .eq('user_id', partnerUser.id);
          const partnerIds = (partnerRecords || []).map(r => r.id);
          if (partnerIds.includes(app.partner_id)) {
            accessibleIds.push(app.id);
            continue;
          }
        }
        // Check if student was referred by team member
        const studentData = app.students as { user_id: string; users?: { referred_by_partner_id: string | null } | Array<{ referred_by_partner_id: string | null }> };
        const userData = Array.isArray(studentData?.users) ? studentData.users[0] : studentData?.users;
        const { data: teamMembers } = await supabase
          .from('users')
          .select('id')
          .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
          .eq('role', 'partner');
        const teamIds = (teamMembers || []).map(m => m.id);
        if (userData?.referred_by_partner_id && teamIds.includes(userData.referred_by_partner_id)) {
          accessibleIds.push(app.id);
        }
      } else {
        // Regular member can only access applications for students they referred
        const studentData = app.students as { user_id: string; users?: { referred_by_partner_id: string | null } | Array<{ referred_by_partner_id: string | null }> };
        const userData = Array.isArray(studentData?.users) ? studentData.users[0] : studentData?.users;
        if (userData?.referred_by_partner_id === partnerUser.id) {
          accessibleIds.push(app.id);
        }
      }
    }

    if (accessibleIds.length === 0) {
      return NextResponse.json({ error: 'No accessible applications found' }, { status: 403 });
    }

    // Perform bulk operation
    let result;
    switch (action) {
      case 'update_status':
        if (!data?.status) {
          return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }
        const validStatuses = ['draft', 'submitted', 'under_review', 'document_request', 'interview_scheduled', 'accepted', 'rejected', 'withdrawn'];
        if (!validStatuses.includes(data.status)) {
          return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }
        const { error: updateError } = await supabase
          .from('applications')
          .update({ 
            status: data.status, 
            updated_at: new Date().toISOString(),
            ...(data.status === 'submitted' ? { submitted_at: new Date().toISOString() } : {}),
          })
          .in('id', accessibleIds);
        if (updateError) {
          return NextResponse.json({ error: 'Failed to update applications' }, { status: 500 });
        }
        result = { updated: accessibleIds.length };
        break;

      case 'delete':
        // Only allow deletion for specific statuses
        const { data: deletableApps } = await supabase
          .from('applications')
          .select('id')
          .in('id', accessibleIds)
          .in('status', ['draft', 'submitted', 'under_review', 'document_request']);
        const deletableIds = (deletableApps || []).map(a => a.id);
        if (deletableIds.length === 0) {
          return NextResponse.json({ error: 'No applications can be deleted (only draft, submitted, under_review, or document_request statuses allowed)' }, { status: 400 });
        }
        const { error: deleteError } = await supabase
          .from('applications')
          .delete()
          .in('id', deletableIds);
        if (deleteError) {
          return NextResponse.json({ error: 'Failed to delete applications' }, { status: 500 });
        }
        result = { deleted: deletableIds.length };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
