/**
 * Partner Context Provider
 * Caches partner role and team information to eliminate redundant database queries
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './auth-context';
import { isPartnerAdmin } from '@/lib/partner/roles';

interface PartnerUser {
  id: string;
  email: string;
  role: string;
  partner_role: 'partner_admin' | 'member' | null;
  partner_id: string | null;
  full_name?: string;
}

interface PartnerContextValue {
  // Role info
  isPartnerAdmin: boolean;
  partnerUser: PartnerUser | null;
  
  // Team info
  teamMemberIds: string[];
  visibleReferrerIds: string[];
  
  // Loading state
  isLoading: boolean;
  
  // Refresh functions
  refreshTeamInfo: () => Promise<void>;
}

const PartnerContext = createContext<PartnerContextValue | undefined>(undefined);

export function PartnerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [partnerUser, setPartnerUser] = useState<PartnerUser | null>(null);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  const [visibleReferrerIds, setVisibleReferrerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch partner team info
  const refreshTeamInfo = useCallback(async () => {
    if (!user || user.role !== 'partner') {
      setPartnerUser(null);
      setTeamMemberIds([]);
      setVisibleReferrerIds([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Get valid token
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      if (!token) {
        setPartnerUser(null);
        setIsLoading(false);
        return;
      }

      // Fetch partner user details (profile)
      const profileResponse = await fetch('/api/partner/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const pUser = profileData.profile as PartnerUser;
        
        if (!pUser) {
          setPartnerUser(null);
          setIsLoading(false);
          return;
        }
        
        setPartnerUser(pUser);

        // Fetch team context via API (server-side operations)
        const contextResponse = await fetch('/api/partner/context', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (contextResponse.ok) {
          const contextData = await contextResponse.json();
          if (contextData.success && contextData.data) {
            setTeamMemberIds(contextData.data.teamMemberIds || []);
            setVisibleReferrerIds(contextData.data.visibleReferrerIds || []);
          } else {
            // Fallback to just self
            setTeamMemberIds([pUser.id]);
            setVisibleReferrerIds([pUser.id]);
          }
        } else {
          // Fallback to just self
          setTeamMemberIds([pUser.id]);
          setVisibleReferrerIds([pUser.id]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch partner team info:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Load team info on mount and when user changes
  useEffect(() => {
    refreshTeamInfo();
  }, [refreshTeamInfo]);

  const value: PartnerContextValue = {
    isPartnerAdmin: isPartnerAdmin(partnerUser),
    partnerUser,
    teamMemberIds,
    visibleReferrerIds,
    isLoading,
    refreshTeamInfo,
  };

  return (
    <PartnerContext.Provider value={value}>
      {children}
    </PartnerContext.Provider>
  );
}

export function usePartner() {
  const context = useContext(PartnerContext);
  if (context === undefined) {
    throw new Error('usePartner must be used within a PartnerProvider');
  }
  return context;
}

/**
 * Hook to check if current user is partner admin
 */
export function useIsPartnerAdmin(): boolean {
  const { isPartnerAdmin } = usePartner();
  return isPartnerAdmin;
}

/**
 * Hook to get team member IDs
 */
export function useTeamMemberIds(): string[] {
  const { teamMemberIds } = usePartner();
  return teamMemberIds;
}

/**
 * Hook to get visible referrer IDs
 */
export function useVisibleReferrerIds(): string[] {
  const { visibleReferrerIds } = usePartner();
  return visibleReferrerIds;
}
