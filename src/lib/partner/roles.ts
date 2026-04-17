/**
 * Partner Role Utilities
 * Single source of truth for partner role checking across the application
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { verifyAuthToken } from '../auth-utils';

export type PartnerRole = 'partner_admin' | 'member';

export interface PartnerUser {
  id: string;
  email: string;
  role: string;
  partner_role: PartnerRole | null;
  partner_id: string | null;
  full_name?: string;
}

/**
 * Check if a partner user is an admin
 * Treats null partner_role as partner_admin for backward compatibility
 * (original partner accounts created before the partner_role column existed)
 */
export function isPartnerAdmin(user: { partner_role?: string | null } | null | undefined): boolean {
  if (!user) return false;
  return !user.partner_role || user.partner_role === 'partner_admin';
}

/**
 * Check if a partner user can access team management features
 * Only partner_admin can manage team members
 */
export function canAccessTeamManagement(user: PartnerUser | null | undefined): boolean {
  return isPartnerAdmin(user);
}

/**
 * Verify partner authentication and return partner user
 */
export async function verifyPartnerAuth(request: NextRequest): Promise<{ user: PartnerUser } | { error: NextResponse }> {
  const user = await verifyAuthToken(request);
  
  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  
  if (user.role !== 'partner') {
    return { error: NextResponse.json({ error: 'Forbidden - Partner access only' }, { status: 403 }) };
  }
  
  // Get full partner user data
  const supabase = getSupabaseClient();
  const { data: partnerUser, error } = await supabase
    .from('users')
    .select('id, email, role, partner_role, partner_id, full_name')
    .eq('id', user.id)
    .maybeSingle();
  
  if (error || !partnerUser) {
    return { error: NextResponse.json({ error: 'Partner user not found' }, { status: 404 }) };
  }
  
  return { user: partnerUser as PartnerUser };
}

/**
 * Verify partner is admin (returns error if not)
 */
export async function requirePartnerAdmin(request: NextRequest): Promise<{ user: PartnerUser } | { error: NextResponse }> {
  const result = await verifyPartnerAuth(request);
  
  if ('error' in result) {
    return result;
  }
  
  const partnerUser = result.user;
  
  if (!isPartnerAdmin(partnerUser)) {
    return { error: NextResponse.json({ error: 'Forbidden - Partner admin access only' }, { status: 403 }) };
  }
  
  return { user: partnerUser };
}

/**
 * Get the partner admin ID for a partner user
 * For partner_admin: returns their own ID
 * For team members: returns their partner_id (admin ID)
 */
export async function getPartnerAdminId(userId: string): Promise<string | null> {
  const supabase = getSupabaseClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, role, partner_role, partner_id')
    .eq('id', userId)
    .maybeSingle();
  
  if (error || !user) {
    return null;
  }
  
  if (user.role !== 'partner') {
    return null;
  }
  
  // Treat null partner_role as partner_admin for backward compatibility
  if (isPartnerAdmin(user)) {
    return user.id;
  }
  
  return user.partner_id;
}

/**
 * Check if a user belongs to a partner's team
 */
export async function isUserInPartnerTeam(
  partnerAdminId: string,
  targetUserId: string
): Promise<boolean> {
  const supabase = getSupabaseClient();
  
  const { data: user, error } = await supabase
    .from('users')
    .select('id, partner_id, partner_role')
    .eq('id', targetUserId)
    .maybeSingle();
  
  if (error || !user) {
    return false;
  }
  
  // Case 1: Target user is the partner admin themselves
  if (user.id === partnerAdminId && isPartnerAdmin(user)) {
    return true;
  }
  
  // Case 2: Target user is a team member with partner_id set to admin
  if (user.partner_id === partnerAdminId) {
    return true;
  }
  
  return false;
}

/**
 * Get all team member IDs for a partner admin
 * Returns array of user IDs including the admin
 */
export async function getPartnerTeamMemberIds(partnerAdminId: string): Promise<string[]> {
  const supabase = getSupabaseClient();
  
  // Get all team members + the admin themselves
  const { data: teamMembers, error } = await supabase
    .from('users')
    .select('id')
    .or(`partner_id.eq.${partnerAdminId},and(id.eq.${partnerAdminId},or(partner_role.eq.partner_admin,partner_role.is.null))`);
  
  if (error) {
    console.error('Failed to fetch team members:', error);
    return [partnerAdminId]; // Fallback to just admin
  }
  
  const ids = (teamMembers || []).map(m => m.id);
  // Ensure admin's own ID is included
  if (!ids.includes(partnerAdminId)) {
    ids.push(partnerAdminId);
  }
  
  return ids;
}

/**
 * Log partner team activity
 */
export async function logPartnerTeamActivity(
  partnerId: string,
  actorId: string,
  targetUserId: string | null,
  action: 'invite' | 'update_role' | 'remove' | 'update_permissions' | 'add_student' | 'update_student',
  actionDetails: Record<string, unknown> = {},
  request?: NextRequest
): Promise<void> {
  const supabase = getSupabaseClient();
  
  const ipAddress = request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip');
  
  const { error } = await supabase
    .from('partner_team_activity')
    .insert({
      partner_id: partnerId,
      actor_id: actorId,
      target_user_id: targetUserId,
      action,
      action_details: actionDetails,
      ip_address: ipAddress,
    });
  
  if (error) {
    console.error('Failed to log partner team activity:', error);
  }
}
