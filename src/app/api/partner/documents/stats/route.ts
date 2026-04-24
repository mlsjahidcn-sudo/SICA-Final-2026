import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth } from '@/lib/partner-auth-utils';

/**
 * GET /api/partner/documents/stats
 * 
 * Get document statistics for partner dashboard.
 * 
 * Returns:
 * - Total documents by status (pending, verified, rejected)
 * - Expiring documents count
 * - Expired documents count
 * - Document requests count by status
 * - Recent activity
 */
export async function GET(request: NextRequest) {
  try {
    const partnerAuth = await verifyPartnerAuth(request);
    if ('error' in partnerAuth) {
      return partnerAuth.error;
    }

    const { user: partnerUser } = partnerAuth;
    const supabase = getSupabaseClient();

    // Get partner's accessible student IDs
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    
    let accessibleStudentIds: string[] = [];
    
    if (isAdmin) {
      // Admin can access students referred by themselves or team members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
        .eq('role', 'partner');
      
      const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
      
      const { data: referredStudents } = await supabase
        .from('users')
        .select('id')
        .in('referred_by_partner_id', teamUserIds);
      
      const studentUserIds = (referredStudents || []).map(s => s.id);
      
      if (studentUserIds.length > 0) {
        const { data: studentRecords } = await supabase
          .from('students')
          .select('id')
          .in('user_id', studentUserIds);
        
        accessibleStudentIds = (studentRecords || []).map(s => s.id);
      }
    } else {
      // Member can only access students they personally referred
      const { data: referredStudents } = await supabase
        .from('users')
        .select('id')
        .eq('referred_by_partner_id', partnerUser.id);
      
      const studentUserIds = (referredStudents || []).map(s => s.id);
      
      if (studentUserIds.length > 0) {
        const { data: studentRecords } = await supabase
          .from('students')
          .select('id')
          .in('user_id', studentUserIds);
        
        accessibleStudentIds = (studentRecords || []).map(s => s.id);
      }
    }

    // If no accessible students, return zeros
    if (accessibleStudentIds.length === 0) {
      return NextResponse.json({
        documents: {
          total: 0,
          pending: 0,
          verified: 0,
          rejected: 0
        },
        expiry: {
          expiring: 0,
          expired: 0
        },
        requests: {
          pending: 0,
          in_progress: 0,
          fulfilled: 0,
          overdue: 0
        }
      });
    }

    // Get document status counts
    const { data: documents } = await supabase
      .from('documents')
      .select('status, expires_at')
      .in('student_id', accessibleStudentIds);

    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const docStats = {
      total: documents?.length || 0,
      pending: documents?.filter(d => d.status === 'pending').length || 0,
      verified: documents?.filter(d => d.status === 'verified').length || 0,
      rejected: documents?.filter(d => d.status === 'rejected').length || 0
    };

    const expiryStats = {
      expiring: documents?.filter(d => {
        if (!d.expires_at) return false;
        const expiresAt = new Date(d.expires_at);
        return expiresAt >= now && expiresAt <= thirtyDaysFromNow;
      }).length || 0,
      expired: documents?.filter(d => {
        if (!d.expires_at) return false;
        return new Date(d.expires_at) < now;
      }).length || 0
    };

    // Get document request counts
    let requestQuery = supabase
      .from('document_requests')
      .select('status, due_date');

    if (isAdmin) {
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
        .eq('role', 'partner');
      
      const teamUserIds = [partnerUser.id, ...(teamMembers || []).map(m => m.id)];
      requestQuery = requestQuery.in('requested_by', teamUserIds);
    } else {
      requestQuery = requestQuery.eq('requested_by', partnerUser.id);
    }

    const { data: requests } = await requestQuery;

    const requestStats = {
      pending: requests?.filter(r => r.status === 'pending').length || 0,
      in_progress: requests?.filter(r => r.status === 'in_progress').length || 0,
      fulfilled: requests?.filter(r => r.status === 'fulfilled').length || 0,
      overdue: requests?.filter(r => {
        if (!r.due_date || ['fulfilled', 'cancelled'].includes(r.status)) return false;
        return new Date(r.due_date) < now;
      }).length || 0
    };

    // Get document type distribution
    const { data: documentsByType } = await supabase
      .from('documents')
      .select('type')
      .in('student_id', accessibleStudentIds);

    const typeDistribution: Record<string, number> = {};
    documentsByType?.forEach(doc => {
      typeDistribution[doc.type] = (typeDistribution[doc.type] || 0) + 1;
    });

    // Get recent uploads (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentUploads } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .in('student_id', accessibleStudentIds)
      .gte('created_at', sevenDaysAgo.toISOString());

    // Get recent verifications (last 7 days)
    const { count: recentVerifications } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .in('student_id', accessibleStudentIds)
      .eq('status', 'verified')
      .gte('verified_at', sevenDaysAgo.toISOString());

    return NextResponse.json({
      documents: docStats,
      expiry: expiryStats,
      requests: requestStats,
      type_distribution: typeDistribution,
      recent_activity: {
        uploads_7d: recentUploads || 0,
        verifications_7d: recentVerifications || 0
      }
    });
  } catch (error) {
    console.error('Error in document stats GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
