/**
 * WebSocket Notifications Handler
 * Handles real-time notifications for users
 */

import { WebSocket, type WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { WsMessage, SubscribeUserPayload } from '../lib/ws-client';
import { NotificationTypes } from '../lib/ws-client';

// Store connected clients by user_id
const connectedClients = new Map<string, Set<WebSocket>>();

// Track user_id for each websocket
const wsToUser = new WeakMap<WebSocket, string>();

/**
 * Setup the notifications WebSocket handler
 */
export function setupNotificationsHandler(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    let alive = true;
    
    // Heartbeat to detect dead connections
    const heartbeatInterval = setInterval(() => {
      if (!alive) {
        ws.terminate();
        return;
      }
      alive = false;
      ws.ping();
    }, 30000);

    ws.on('pong', () => {
      alive = true;
    });

    ws.on('message', (raw: Buffer) => {
      try {
        const msg: WsMessage = JSON.parse(raw.toString());
        
        // Handle ping/pong
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', payload: null }));
          return;
        }

        // Handle user subscription
        if (msg.type === NotificationTypes.SUBSCRIBE_USER) {
          const payload = msg.payload as SubscribeUserPayload;
          const userId = payload.user_id;
          
          // Store the mapping
          wsToUser.set(ws, userId);
          
          // Add to connected clients
          if (!connectedClients.has(userId)) {
            connectedClients.set(userId, new Set());
          }
          connectedClients.get(userId)!.add(ws);
          
          console.log(`[WS] User ${userId} subscribed to notifications`);
          
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'subscription:confirmed',
            payload: { user_id: userId }
          }));
          return;
        }

        // Handle user unsubscription
        if (msg.type === NotificationTypes.UNSUBSCRIBE_USER) {
          const userId = wsToUser.get(ws);
          if (userId) {
            const clients = connectedClients.get(userId);
            if (clients) {
              clients.delete(ws);
              if (clients.size === 0) {
                connectedClients.delete(userId);
              }
            }
            wsToUser.delete(ws);
            console.log(`[WS] User ${userId} unsubscribed from notifications`);
          }
          return;
        }
      } catch (error) {
        console.error('[WS] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeatInterval);
      
      // Clean up user mapping
      const userId = wsToUser.get(ws);
      if (userId) {
        const clients = connectedClients.get(userId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            connectedClients.delete(userId);
          }
        }
        wsToUser.delete(ws);
        console.log(`[WS] User ${userId} disconnected`);
      }
    });

    ws.on('error', (error) => {
      console.error('[WS] WebSocket error:', error);
      clearInterval(heartbeatInterval);
    });
  });
}

/**
 * Send a notification to a specific user
 */
export function sendNotificationToUser(userId: string, notification: WsMessage): boolean {
  const clients = connectedClients.get(userId);
  if (!clients || clients.size === 0) {
    return false;
  }

  const message = JSON.stringify(notification);
  let sent = false;
  
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sent = true;
    }
  });

  return sent;
}

/**
 * Send a notification to multiple users
 */
export function sendNotificationToUsers(userIds: string[], notification: WsMessage): void {
  userIds.forEach((userId) => {
    sendNotificationToUser(userId, notification);
  });
}

/**
 * Broadcast a notification to all connected clients
 */
export function broadcastNotification(notification: WsMessage): void {
  const message = JSON.stringify(notification);
  
  connectedClients.forEach((clients) => {
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  });
}

/**
 * Get the number of connected users
 */
export function getConnectedUsersCount(): number {
  return connectedClients.size;
}

/**
 * Check if a user is connected
 */
export function isUserConnected(userId: string): boolean {
  const clients = connectedClients.get(userId);
  return !!clients && clients.size > 0;
}
