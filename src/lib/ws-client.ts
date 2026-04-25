/**
 * WebSocket Client Library
 * Provides a type-safe WebSocket connection with reconnection and heartbeat support
 */

// Message type for all WebSocket communications
export interface WsMessage<T = unknown> {
  type: string;
  payload: T;
}

// Connection options
export interface WsOptions {
  path: string; // WebSocket path, e.g., '/ws/notifications'
  onMessage: (msg: WsMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnect?: boolean; // Default: true
  reconnectDelay?: number; // Default: 1000ms
  maxReconnectDelay?: number; // Default: 30000ms
  reconnectBackoff?: 'fixed' | 'exponential'; // Default: exponential
  reconnectJitter?: boolean; // Default: true
  heartbeatMs?: number; // Default: 30000ms
}

// Connection handle returned to the caller
export interface WsConnection {
  send: (msg: WsMessage) => void;
  close: () => void;
  isConnected: () => boolean;
}

/**
 * Create a WebSocket connection with automatic reconnection and heartbeat
 */
export function createWsConnection(opts: WsOptions): WsConnection {
  const {
    path,
    onMessage,
    onOpen,
    onClose,
    onError,
    reconnect = true,
    reconnectDelay = 1000,
    maxReconnectDelay = 30000,
    reconnectBackoff = 'exponential',
    reconnectJitter = true,
    heartbeatMs = 30000,
  } = opts;

  let ws: WebSocket | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let closed = false;
  let reconnectAttempts = 0;

  function scheduleReconnect() {
    if (!reconnect || closed) return;

    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    let delay = reconnectDelay;
    if (reconnectBackoff === 'exponential') {
      delay = Math.min(maxReconnectDelay, reconnectDelay * 2 ** reconnectAttempts);
    }
    if (reconnectJitter) {
      delay = Math.round(delay * (0.5 + Math.random()));
    }

    reconnectAttempts++;
    reconnectTimer = setTimeout(connect, delay);
  }

  function connect() {
    if (closed || typeof window === 'undefined') return;

    try {
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${protocol}//${location.host}${path}`);

      ws.onopen = () => {
        reconnectAttempts = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
        // Start heartbeat
        heartbeatTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', payload: null }));
          }
        }, heartbeatMs);
        onOpen?.();
      };

      ws.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          // Ignore pong messages
          if (msg.type === 'pong') return;
          onMessage(msg);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
          heartbeatTimer = null;
        }
        onClose?.();
        
        // Attempt to reconnect if not manually closed
        scheduleReconnect();
      };

      ws.onerror = (error) => {
        onError?.(error);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      scheduleReconnect();
    }
  }

  connect();

  return {
    send: (msg: WsMessage) => {
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      }
    },
    close: () => {
      closed = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
      if (ws) {
        ws.close();
        ws = null;
      }
    },
    isConnected: () => ws?.readyState === WebSocket.OPEN,
  };
}

/**
 * Notification types for WebSocket messages
 */
export const NotificationTypes = {
  // Server -> Client notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_UPDATE: 'notification:update',
  NOTIFICATION_UNREAD_COUNT: 'notification:unread_count',
  MEETING_REMINDER: 'meeting:reminder',
  APPLICATION_STATUS_CHANGE: 'application:status_change',
  DOCUMENT_STATUS_CHANGE: 'document:status_change',
  
  // Client -> Server requests
  SUBSCRIBE_USER: 'subscribe:user',
  UNSUBSCRIBE_USER: 'unsubscribe:user',
} as const;

// Notification payload types
export interface NotificationNewPayload {
  id: string;
  type: string;
  title: string;
  content: string;
  link?: string;
  created_at: string;
}

export interface MeetingReminderPayload {
  meeting_id: string;
  title: string;
  meeting_date: string;
  platform: string;
  meeting_url: string;
  minutes_until: number;
}

export interface ApplicationStatusPayload {
  application_id: string;
  old_status: string;
  new_status: string;
  program_name: string;
  university_name: string;
}

export interface DocumentStatusPayload {
  document_id: string;
  document_type: string;
  status: string;
  rejection_reason?: string;
}

export interface UnreadCountPayload {
  count: number;
}

export interface SubscribeUserPayload {
  user_id: string;
  role: string;
}
