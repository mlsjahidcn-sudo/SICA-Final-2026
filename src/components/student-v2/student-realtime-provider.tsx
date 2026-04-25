/**
 * Student Portal v2 Real-time Notifications Wrapper
 * Client component that sets up WebSocket notifications for authenticated students
 */

'use client';

import React from 'react';
import { RealtimeNotificationsProvider } from '@/contexts/realtime-notifications-context';
import { 
  showNotificationToast, 
  showMeetingReminderToast, 
  showApplicationStatusToast,
  showDocumentStatusToast 
} from '@/components/realtime-notification-toast';
import type { 
  NotificationNewPayload,
  MeetingReminderPayload,
  ApplicationStatusPayload,
  DocumentStatusPayload 
} from '@/lib/ws-client';

interface StudentRealtimeProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function StudentRealtimeProvider({ children, userId }: StudentRealtimeProviderProps) {
  // Handle new notification
  const handleNewNotification = React.useCallback((notification: NotificationNewPayload) => {
    showNotificationToast(notification);
  }, []);

  // Handle meeting reminder
  const handleMeetingReminder = React.useCallback((reminder: MeetingReminderPayload) => {
    showMeetingReminderToast(reminder);
  }, []);

  // Handle application status change
  const handleApplicationStatusChange = React.useCallback((change: ApplicationStatusPayload) => {
    showApplicationStatusToast(change);
  }, []);

  // Handle document status change
  const handleDocumentStatusChange = React.useCallback((change: DocumentStatusPayload) => {
    showDocumentStatusToast(change);
  }, []);

  // Only enable if user is authenticated
  const enabled = !!userId;

  return (
    <RealtimeNotificationsProvider
      userId={userId}
      role="student"
      enabled={enabled}
      onNewNotification={handleNewNotification}
      onMeetingReminder={handleMeetingReminder}
      onApplicationStatusChange={handleApplicationStatusChange}
      onDocumentStatusChange={handleDocumentStatusChange}
    >
      {children}
    </RealtimeNotificationsProvider>
  );
}
