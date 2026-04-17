import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyPartnerAuth, getPartnerAdminId } from '@/lib/partner-auth-utils';

/**
 * POST /api/partner/students/bulk
 * Bulk operations on students (delete)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyPartnerAuth(request);
    if ('error' in authResult) return authResult.error;
    const partnerUser = authResult.user;

    const body = await request.json();
    const { action, studentIds } = body;

    if (!action || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // Get the list of user IDs this partner can see
    const isAdmin = !partnerUser.partner_role || partnerUser.partner_role === 'partner_admin';
    let visibleUserIds: string[] = [];

    if (isAdmin) {
      // Admin sees students referred by themselves and all team members
      const { data: teamMembers } = await supabase
        .from('users')
        .select('id')
        .or(`id.eq.${partnerUser.id},partner_id.eq.${partnerUser.id}`)
        .eq('role', 'partner');
      visibleUserIds = (teamMembers || []).map(m => m.id);
      if (!visibleUserIds.includes(partnerUser.id)) visibleUserIds.push(partnerUser.id);
    } else {
      // Member sees only students they personally referred
      visibleUserIds = [partnerUser.id];
    }

    // Get students referred by visible partner users
    const { data: referredStudents, error: fetchError } = await supabase
      .from('users')
      .select('id, students (id)')
      .in('referred_by_partner_id', visibleUserIds)
      .eq('role', 'student')
      .in('id', studentIds);

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    // Filter to only accessible students
    const accessibleUserIds = (referredStudents || []).map(u => u.id);

    if (accessibleUserIds.length === 0) {
      return NextResponse.json({ error: 'No accessible students found' }, { status: 403 });
    }

    // Perform bulk operation
    let result;
    switch (action) {
      case 'delete':
        // Check for active applications
        const { data: studentsWithApps } = await supabase
          .from('students')
          .select('id, applications(count)')
          .in('user_id', accessibleUserIds);

        const studentsWithActiveApps = (studentsWithApps || []).filter(
          s => (s.applications as unknown as { count: number }[])?.[0]?.count > 0
        );

        if (studentsWithActiveApps.length > 0) {
          return NextResponse.json({
            error: `Cannot delete ${studentsWithActiveApps.length} student(s) with active applications`,
          }, { status: 400 });
        }

        // Delete students (this will cascade to related records if configured)
        const { error: deleteError } = await supabase
          .from('students')
          .delete()
          .in('user_id', accessibleUserIds);

        if (deleteError) {
          console.error('Error deleting students:', deleteError);
          return NextResponse.json({ error: 'Failed to delete students' }, { status: 500 });
        }

        // Optionally delete user accounts too
        // const { error: userDeleteError } = await supabase.auth.admin.deleteUsers(accessibleUserIds);

        result = { deleted: accessibleUserIds.length };
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
