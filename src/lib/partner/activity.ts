/**
 * Partner Activity Logging Hook
 * Provides easy-to-use activity logging for partner portal actions
 */

'use client';

import { useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePartner } from '@/contexts/partner-context';
import { logPartnerTeamActivity } from './roles';

type PartnerAction = 
  | 'invite' 
  | 'update_role' 
  | 'remove' 
  | 'update_permissions' 
  | 'add_student' 
  | 'update_student'
  | 'delete_student'
  | 'view_application'
  | 'update_application'
  | 'upload_document'
  | 'verify_document'
  | 'reject_document';

/**
 * Hook to log partner portal activities
 * Automatically captures actor and team information
 */
export function usePartnerActivity() {
  const { user } = useAuth();
  const { partnerUser } = usePartner();

  const logActivity = useCallback(async (
    action: PartnerAction,
    targetUserId: string | null,
    details: Record<string, unknown> = {}
  ) => {
    if (!user || !partnerUser) {
      console.warn('[Partner Activity] Cannot log activity: user or partnerUser not available');
      return;
    }

    try {
      // Determine the team ID (partner admin ID)
      const teamId = partnerUser.partner_role === 'partner_admin' || !partnerUser.partner_role
        ? partnerUser.id
        : partnerUser.partner_id;

      if (!teamId) {
        console.warn('[Partner Activity] Cannot log activity: team ID not found');
        return;
      }

      await logPartnerTeamActivity(
        teamId,
        user.id,
        targetUserId,
        action,
        {
          ...details,
          actor_name: user.full_name,
          actor_email: user.email,
          timestamp: new Date().toISOString(),
        }
      );

      console.log('[Partner Activity] Logged:', action, details);
    } catch (error) {
      console.error('[Partner Activity] Failed to log activity:', error);
    }
  }, [user, partnerUser]);

  return { logActivity };
}

/**
 * Activity logging helper functions
 * Pre-defined activity types for common actions
 */
export function usePartnerActivityHelpers() {
  const { logActivity } = usePartnerActivity();

  const logStudentAdded = useCallback((studentId: string, studentName: string, studentEmail: string) => {
    return logActivity('add_student', studentId, {
      student_name: studentName,
      student_email: studentEmail,
    });
  }, [logActivity]);

  const logStudentUpdated = useCallback((studentId: string, studentName: string, changes: string[]) => {
    return logActivity('update_student', studentId, {
      student_name: studentName,
      changes,
    });
  }, [logActivity]);

  const logStudentDeleted = useCallback((studentId: string, studentName: string) => {
    return logActivity('delete_student', studentId, {
      student_name: studentName,
    });
  }, [logActivity]);

  const logApplicationViewed = useCallback((applicationId: string, studentName: string) => {
    return logActivity('view_application', null, {
      application_id: applicationId,
      student_name: studentName,
    });
  }, [logActivity]);

  const logApplicationUpdated = useCallback((applicationId: string, studentName: string, changes: string[]) => {
    return logActivity('update_application', null, {
      application_id: applicationId,
      student_name: studentName,
      changes,
    });
  }, [logActivity]);

  const logDocumentUploaded = useCallback((documentId: string, documentType: string, studentName: string) => {
    return logActivity('upload_document', null, {
      document_id: documentId,
      document_type: documentType,
      student_name: studentName,
    });
  }, [logActivity]);

  const logDocumentVerified = useCallback((documentId: string, documentType: string, studentName: string) => {
    return logActivity('verify_document', null, {
      document_id: documentId,
      document_type: documentType,
      student_name: studentName,
    });
  }, [logActivity]);

  const logDocumentRejected = useCallback((documentId: string, documentType: string, studentName: string, reason?: string) => {
    return logActivity('reject_document', null, {
      document_id: documentId,
      document_type: documentType,
      student_name: studentName,
      reason,
    });
  }, [logActivity]);

  const logTeamMemberInvited = useCallback((memberId: string, memberName: string, memberEmail: string, role: string) => {
    return logActivity('invite', memberId, {
      member_name: memberName,
      member_email: memberEmail,
      role,
    });
  }, [logActivity]);

  const logTeamMemberUpdated = useCallback((memberId: string, memberName: string, changes: string[]) => {
    return logActivity('update_role', memberId, {
      member_name: memberName,
      changes,
    });
  }, [logActivity]);

  const logTeamMemberRemoved = useCallback((memberId: string, memberName: string) => {
    return logActivity('remove', memberId, {
      member_name: memberName,
    });
  }, [logActivity]);

  return {
    logActivity,
    logStudentAdded,
    logStudentUpdated,
    logStudentDeleted,
    logApplicationViewed,
    logApplicationUpdated,
    logDocumentUploaded,
    logDocumentVerified,
    logDocumentRejected,
    logTeamMemberInvited,
    logTeamMemberUpdated,
    logTeamMemberRemoved,
  };
}
