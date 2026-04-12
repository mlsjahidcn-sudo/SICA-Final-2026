/**
 * Real-time Notifications Context
 * Provides real-time notification updates via WebSocket
 */

'use client';

import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { useNotificationsWebSocket } from '@/hooks/use-websocket';
import { 
  NotificationTypes,
  type NotificationNewPayload,
  type MeetingReminderPayload,
  type ApplicationStatusPayload,
  type DocumentStatusPayload,
} from '@/lib/ws-client';

// Context types
interface RealtimeNotificationsContextValue {
  // Connection status
  isConnected: boolean;
  
  // Latest notifications
  pendingNotifications: NotificationNewPayload[];
  
  // Acknowledge a notification (remove from pending)
  acknowledgeNotification: (id: string) => void;
  
  // Clear all pending notifications
  clearPendingNotifications: () => void;
  
  // Toast callbacks
  onMeetingReminder?: (reminder: MeetingReminderPayload) => void;
  onApplicationStatusChange?: (change: ApplicationStatusPayload) => void;
  onDocumentStatusChange?: (change: DocumentStatusPayload) => void;
}

const RealtimeNotificationsContext = createContext<RealtimeNotificationsContextValue | null>(null);

interface RealtimeNotificationsProviderProps {
  children: React.ReactNode;
  userId?: string;
  role?: string;
  enabled?: boolean;
  onNewNotification?: (notification: NotificationNewPayload) => void;
  onMeetingReminder?: (reminder: MeetingReminderPayload) => void;
  onApplicationStatusChange?: (change: ApplicationStatusPayload) => void;
  onDocumentStatusChange?: (change: DocumentStatusPayload) => void;
}

export function RealtimeNotificationsProvider({
  children,
  userId,
  role,
  enabled = true,
  onNewNotification,
  onMeetingReminder,
  onApplicationStatusChange,
  onDocumentStatusChange,
}: RealtimeNotificationsProviderProps) {
  const [pendingNotifications, setPendingNotifications] = useState<NotificationNewPayload[]>([]);

  // Handle incoming notifications
  const handleNewNotification = useCallback((payload: unknown) => {
    const notification = payload as NotificationNewPayload;
    setPendingNotifications((prev) => [...prev, notification]);
    onNewNotification?.(notification);
  }, [onNewNotification]);

  const handleMeetingReminder = useCallback((payload: unknown) => {
    const reminder = payload as MeetingReminderPayload;
    onMeetingReminder?.(reminder);
  }, [onMeetingReminder]);

  const handleStatusChange = useCallback((payload: unknown) => {
    // Determine type based on which callback is set
    if (onApplicationStatusChange) {
      onApplicationStatusChange(payload as ApplicationStatusPayload);
    }
    if (onDocumentStatusChange) {
      onDocumentStatusChange(payload as DocumentStatusPayload);
    }
  }, [onApplicationStatusChange, onDocumentStatusChange]);

  // WebSocket connection
  const { isConnected } = useNotificationsWebSocket({
    userId,
    role,
    enabled,
    onNewNotification: handleNewNotification,
    onMeetingReminder: handleMeetingReminder,
    onStatusChange: handleStatusChange,
  });

  // Acknowledge a notification
  const acknowledgeNotification = useCallback((id: string) => {
    setPendingNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Clear all pending notifications
  const clearPendingNotifications = useCallback(() => {
    setPendingNotifications([]);
  }, []);

  const value: RealtimeNotificationsContextValue = {
    isConnected,
    pendingNotifications,
    acknowledgeNotification,
    clearPendingNotifications,
    onMeetingReminder,
    onApplicationStatusChange,
    onDocumentStatusChange,
  };

  return (
    <RealtimeNotificationsContext.Provider value={value}>
      {children}
    </RealtimeNotificationsContext.Provider>
  );
}

/**
 * Hook to access real-time notifications
 */
export function useRealtimeNotifications(): RealtimeNotificationsContextValue {
  const context = useContext(RealtimeNotificationsContext);
  if (!context) {
    throw new Error('useRealtimeNotifications must be used within RealtimeNotificationsProvider');
  }
  return context;
}

/**
 * Hook to check if real-time notifications are connected
 */
export function useIsRealtimeConnected(): boolean {
  const context = useContext(RealtimeNotificationsContext);
  return context?.isConnected ?? false;
}
