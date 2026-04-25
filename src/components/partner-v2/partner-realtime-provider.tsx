/**
 * Partner Realtime Provider
 * Provides real-time updates for partner portal via WebSocket
 */

'use client';

import { useEffect, useCallback, useRef, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { usePartner } from '@/contexts/partner-context';
import { toast } from 'sonner';

interface PartnerRealtimeMessage {
  type: 'team_activity' | 'student_update' | 'application_update' | 'document_update';
  payload: {
    action: string;
    entityId?: string;
    actorId?: string;
    actorName?: string;
    timestamp: string;
    [key: string]: unknown;
  };
  teamId: string; // partner admin ID
}

interface PartnerRealtimeProviderProps {
  children: ReactNode;
}

export function PartnerRealtimeProvider({ children }: PartnerRealtimeProviderProps) {
  const { user } = useAuth();
  const { partnerUser, refreshTeamInfo, isPartnerAdmin } = usePartner();
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: PartnerRealtimeMessage = JSON.parse(event.data);
      
      // Only process messages for our team
      if (!partnerUser) return;
      const teamId = (isPartnerAdmin ? partnerUser.id : partnerUser.partner_id) || '';
      if (message.teamId !== teamId) return;

      // Handle different message types
      switch (message.type) {
        case 'team_activity':
          handleTeamActivity(message.payload);
          break;
        case 'student_update':
          handleStudentUpdate(message.payload);
          break;
        case 'application_update':
          handleApplicationUpdate(message.payload);
          break;
        case 'document_update':
          handleDocumentUpdate(message.payload);
          break;
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [partnerUser, isPartnerAdmin]);

  // Handle team activity updates
  const handleTeamActivity = useCallback((payload: PartnerRealtimeMessage['payload']) => {
    // Refresh team info when team changes
    refreshTeamInfo();

    // Show notification
    const actionText = {
      invite: 'joined the team',
      remove: 'was removed from the team',
      update_role: 'role was updated',
    }[payload.action] || payload.action;

    toast.info(`Team Update`, {
      description: `${payload.actorName || 'A team member'} ${actionText}`,
    });
  }, [refreshTeamInfo]);

  // Handle student updates
  const handleStudentUpdate = useCallback((payload: PartnerRealtimeMessage['payload']) => {
    // Dispatch custom event for student pages to listen to
    window.dispatchEvent(new CustomEvent('partner-student-update', { 
      detail: payload 
    }));

    // Only show notification for significant actions
    if (['created', 'updated', 'deleted'].includes(payload.action)) {
      toast.info('Student Updated', {
        description: `Student data was ${payload.action} by ${payload.actorName || 'a team member'}`,
      });
    }
  }, []);

  // Handle application updates
  const handleApplicationUpdate = useCallback((payload: PartnerRealtimeMessage['payload']) => {
    // Dispatch custom event for application pages to listen to
    window.dispatchEvent(new CustomEvent('partner-application-update', { 
      detail: payload 
    }));

    toast.info('Application Updated', {
      description: `Application was ${payload.action} by ${payload.actorName || 'a team member'}`,
    });
  }, []);

  // Handle document updates
  const handleDocumentUpdate = useCallback((payload: PartnerRealtimeMessage['payload']) => {
    // Dispatch custom event for document pages to listen to
    window.dispatchEvent(new CustomEvent('partner-document-update', { 
      detail: payload 
    }));

    if (payload.action === 'uploaded') {
      toast.info('Document Uploaded', {
        description: `A new document was uploaded by ${payload.actorName || 'a team member'}`,
      });
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!partnerUser || wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Use current host and correct endpoint
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = process.env.NEXT_PUBLIC_WS_URL 
        ? process.env.NEXT_PUBLIC_WS_URL.replace(/^https?:\/\//, '').replace(/^wss?:\/\//, '')
        : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/partner`;
      
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Partner Realtime] Connected');
        setIsConnected(true);

        // Send authentication
        const teamId = (isPartnerAdmin ? partnerUser.id : partnerUser.partner_id) || '';
        ws.send(JSON.stringify({
          type: 'auth',
          userId: user?.id,
          teamId,
          role: partnerUser.partner_role,
        }));
      };

      ws.onmessage = handleMessage;

      ws.onerror = (error) => {
        console.error('[Partner Realtime] Error:', error);
      };

      ws.onclose = () => {
        console.log('[Partner Realtime] Disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Partner Realtime] Connection failed:', error);
    }
  }, [partnerUser, isPartnerAdmin, user?.id, handleMessage]);

  // Connect on mount and when partner user changes
  useEffect(() => {
    if (partnerUser) {
      connect();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [partnerUser, connect]);

  // Broadcast update to team members
  const broadcastUpdate = useCallback((type: PartnerRealtimeMessage['type'], payload: PartnerRealtimeMessage['payload']) => {
    if (!partnerUser || wsRef.current?.readyState !== WebSocket.OPEN) return;

    const teamId = (isPartnerAdmin ? partnerUser.id : partnerUser.partner_id) || '';
    const message: PartnerRealtimeMessage = {
      type,
      payload: {
        ...payload,
        actorId: user?.id,
        actorName: user?.full_name,
        timestamp: new Date().toISOString(),
      },
      teamId,
    };

    wsRef.current.send(JSON.stringify(message));
  }, [partnerUser, isPartnerAdmin, user?.id, user?.full_name]);

  // Provide broadcast function globally
  useEffect(() => {
    (window as any).broadcastPartnerUpdate = broadcastUpdate;
    return () => {
      delete (window as any).broadcastPartnerUpdate;
    };
  }, [broadcastUpdate]);

  return <>{children}</>;
}

/**
 * Hook to broadcast partner updates
 */
export function usePartnerBroadcast() {
  const broadcast = useCallback((
    type: PartnerRealtimeMessage['type'],
    payload: PartnerRealtimeMessage['payload']
  ) => {
    if (typeof window !== 'undefined' && (window as any).broadcastPartnerUpdate) {
      (window as any).broadcastPartnerUpdate(type, payload);
    }
  }, []);

  return broadcast;
}

/**
 * Hook to listen for partner updates
 */
export function usePartnerUpdates(
  eventType: 'student' | 'application' | 'document',
  callback: (payload: any) => void
) {
  useEffect(() => {
    const eventName = `partner-${eventType}-update`;
    
    const handler = (event: CustomEvent) => {
      callback(event.detail);
    };

    window.addEventListener(eventName, handler as EventListener);
    
    return () => {
      window.removeEventListener(eventName, handler as EventListener);
    };
  }, [eventType, callback]);
}
