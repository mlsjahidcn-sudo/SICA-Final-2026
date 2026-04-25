/**
 * React Hook for WebSocket connections
 * Provides real-time data with automatic reconnection
 */

'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createWsConnection, type WsMessage, type WsConnection } from '@/lib/ws-client';

export interface UseWebSocketOptions {
  path: string;
  onMessage?: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  enabled?: boolean;
  reconnect?: boolean;
  heartbeatMs?: number;
}

export interface UseWebSocketReturn {
  send: (msg: WsMessage) => void;
  isConnected: boolean;
  connectionError: Event | null;
}

/**
 * React hook for WebSocket connections with automatic reconnection
 */
export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const {
    path,
    onMessage,
    onOpen,
    onClose,
    onError,
    enabled = true,
    reconnect = true,
    heartbeatMs = 30000,
  } = options;

  const connRef = useRef<WsConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Event | null>(null);

  // Stable callback refs
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onCloseRef.current = onClose;
    onErrorRef.current = onError;
  }, [onMessage, onOpen, onClose, onError]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') {
      return;
    }

    connRef.current = createWsConnection({
      path,
      onMessage: (msg) => onMessageRef.current?.(msg),
      onOpen: () => {
        setIsConnected(true);
        setConnectionError(null);
        onOpenRef.current?.();
      },
      onClose: () => {
        setIsConnected(false);
        onCloseRef.current?.();
      },
      onError: (error) => {
        setConnectionError(error);
        onErrorRef.current?.(error);
      },
      reconnect,
      heartbeatMs,
    });

    return () => {
      connRef.current?.close();
      connRef.current = null;
      setIsConnected(false);
    };
  }, [path, enabled, reconnect, heartbeatMs]);

  const send = useCallback((msg: WsMessage) => {
    connRef.current?.send(msg);
  }, []);

  return { send, isConnected, connectionError };
}

/**
 * Hook specifically for notifications WebSocket
 */
export function useNotificationsWebSocket(options: {
  userId?: string;
  role?: string;
  enabled?: boolean;
  onNewNotification?: (notification: unknown) => void;
  onMeetingReminder?: (reminder: unknown) => void;
  onStatusChange?: (change: unknown) => void;
}): {
  isConnected: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
} {
  const {
    userId,
    role,
    enabled = true,
    onNewNotification,
    onMeetingReminder,
    onStatusChange,
  } = options;

  const { send, isConnected } = useWebSocket({
    path: '/ws/notifications',
    enabled: enabled && !!userId,
    onMessage: (msg) => {
      switch (msg.type) {
        case 'notification:new':
          onNewNotification?.(msg.payload);
          break;
        case 'meeting:reminder':
          onMeetingReminder?.(msg.payload);
          break;
        case 'application:status_change':
        case 'document:status_change':
          onStatusChange?.(msg.payload);
          break;
      }
    },
  });

  const subscribe = useCallback(() => {
    if (userId && role && isConnected) {
      send({
        type: 'subscribe:user',
        payload: { user_id: userId, role },
      });
    }
  }, [userId, role, isConnected, send]);

  const unsubscribe = useCallback(() => {
    if (isConnected) {
      send({
        type: 'unsubscribe:user',
        payload: {},
      });
    }
  }, [isConnected, send]);

  // Auto-subscribe when connected
  useEffect(() => {
    if (isConnected && userId && role) {
      subscribe();
    }
  }, [isConnected, userId, role, subscribe]);

  return { isConnected, subscribe, unsubscribe };
}
