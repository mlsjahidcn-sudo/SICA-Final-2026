/**
 * Partner Data Visibility Utilities
 * Centralized logic for determining what data a partner user can access
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PartnerUser, isPartnerAdmin, getPartnerTeamMemberIds } from './roles';

/**
 * Get the list of user IDs whose students the current partner user can see.
 * - Admin: sees students referred by themselves + all team members
 * - Member: sees only students referred by themselves
 */
export async function getVisibleReferrerIds(partnerUser: PartnerUser): Promise<string[]> {
  if (isPartnerAdmin(partnerUser)) {
    // Admin sees students referred by themselves and all their team members
    const teamIds = await getPartnerTeamMemberIds(partnerUser.id);
    return teamIds;
  } else {
    // Member sees only students they personally referred
    return [partnerUser.id];
  }
}

/**
 * Get the list of student user IDs visible to the partner user
 * This includes:
 * 1. Students referred by the partner user (or team members, if admin)
 * 2. Students who have applications with the partner organization
 */
export async function getVisibleStudentUserIds(partnerUser: PartnerUser): Promise<Set<string>> {
  const supabase = getSupabaseClient();
  const visibleUserIds = new Set<string>();

  // 1. Get students referred by partner users
  const referrerIds = await getVisibleReferrerIds(partnerUser);
  
  const { data: referredStudents } = await supabase
    .from('users')
    .select('id')
    .in('referred_by_partner_id', referrerIds)
    .eq('role', 'student');

  (referredStudents || []).forEach(s => visibleUserIds.add(s.id));

  // 2. For admins, also get students via applications (partner_id in applications table)
  if (isPartnerAdmin(partnerUser)) {
    // Get partner record ID
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', partnerUser.id)
      .maybeSingle();

    if (partnerRecord) {
      const { data: applications } = await supabase
        .from('applications')
        .select('student_id')
        .eq('partner_id', partnerRecord.id)
        .neq('status', 'draft');

      // Get student user IDs from student records
      if (applications && applications.length > 0) {
        const studentIds = applications.map(a => a.student_id).filter(Boolean);
        
        if (studentIds.length > 0) {
          const { data: studentRecords } = await supabase
            .from('students')
            .select('user_id')
            .in('id', studentIds);

          (studentRecords || []).forEach(s => {
            if (s.user_id) visibleUserIds.add(s.user_id);
          });
        }
      }
    }
  }

  return visibleUserIds;
}

/**
 * Get the list of application IDs visible to the partner user
 * - Admin: sees all applications for their partner organization
 * - Member: sees applications for students they referred
 */
export async function getVisibleApplicationIds(partnerUser: PartnerUser): Promise<Set<string>> {
  const supabase = getSupabaseClient();
  const visibleAppIds = new Set<string>();

  if (isPartnerAdmin(partnerUser)) {
    // Admin sees all applications for their partner organization
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', partnerUser.id)
      .maybeSingle();

    if (partnerRecord) {
      const { data: applications } = await supabase
        .from('applications')
        .select('id')
        .eq('partner_id', partnerRecord.id);

      (applications || []).forEach(a => visibleAppIds.add(a.id));
    }
  } else {
    // Member sees applications for students they referred
    const { data: studentRecords } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', partnerUser.id);

    const studentIds = (studentRecords || []).map(s => s.id);

    if (studentIds.length > 0) {
      const { data: applications } = await supabase
        .from('applications')
        .select('id')
        .in('student_id', studentIds);

      (applications || []).forEach(a => visibleAppIds.add(a.id));
    }
  }

  return visibleAppIds;
}

/**
 * Check if a partner user can access a specific student
 */
export async function canPartnerAccessStudent(
  partnerUser: PartnerUser,
  studentUserId: string
): Promise<boolean> {
  const visibleUserIds = await getVisibleStudentUserIds(partnerUser);
  return visibleUserIds.has(studentUserId);
}

/**
 * Check if a partner user can access a specific application
 */
export async function canPartnerAccessApplication(
  partnerUser: PartnerUser,
  applicationId: string
): Promise<boolean> {
  const visibleAppIds = await getVisibleApplicationIds(partnerUser);
  return visibleAppIds.has(applicationId);
}

/**
 * Get partner organization ID for a partner user
 * Returns the partners.id (not users.id)
 */
export async function getPartnerOrganizationId(partnerUser: PartnerUser): Promise<string | null> {
  if (!isPartnerAdmin(partnerUser)) {
    // Members need to look up their admin's partner record
    const adminId = partnerUser.partner_id;
    if (!adminId) return null;

    const supabase = getSupabaseClient();
    const { data: partnerRecord } = await supabase
      .from('partners')
      .select('id')
      .eq('user_id', adminId)
      .maybeSingle();

    return partnerRecord?.id || null;
  }

  // Admin: get their own partner record
  const supabase = getSupabaseClient();
  const { data: partnerRecord } = await supabase
    .from('partners')
    .select('id')
    .eq('user_id', partnerUser.id)
    .maybeSingle();

  return partnerRecord?.id || null;
}
