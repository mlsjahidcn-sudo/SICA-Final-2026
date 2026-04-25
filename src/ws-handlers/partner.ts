/**
 * WebSocket Partner Handler
 * Handles real-time updates for partner portal
 */

import { WebSocket, type WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';

// Store connected clients by team_id (partner admin user_id)
const teamClients = new Map<string, Set<WebSocket>>();

// Track team_id and user_id for each websocket
const wsToTeam = new WeakMap<WebSocket, { teamId: string; userId: string; role: string }>();

interface PartnerMessage {
  type: 'auth' | 'team_activity' | 'student_update' | 'application_update' | 'document_update';
  userId?: string;
  teamId?: string;
  role?: string;
  payload?: {
    action: string;
    entityId?: string;
    actorId?: string;
    actorName?: string;
    timestamp: string;
    [key: string]: unknown;
  };
}

/**
 * Setup the partner WebSocket handler
 */
export function setupPartnerHandler(wss: WebSocketServer) {
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
        const msg: PartnerMessage = JSON.parse(raw.toString());
        
        // Handle authentication
        if (msg.type === 'auth') {
          const { userId, teamId, role } = msg;
          
          if (!userId || !teamId) {
            ws.send(JSON.stringify({ type: 'error', payload: 'Missing auth fields' }));
            return;
          }
          
          // Store the mapping
          wsToTeam.set(ws, { teamId, userId, role: role || 'member' });
          
          // Add to team clients
          if (!teamClients.has(teamId)) {
            teamClients.set(teamId, new Set());
          }
          teamClients.get(teamId)!.add(ws);
          
          console.log(`[WS Partner] User ${userId} connected to team ${teamId}`);
          
          // Send acknowledgment
          ws.send(JSON.stringify({
            type: 'auth:confirmed',
            payload: { userId, teamId }
          }));
          return;
        }

        // Handle team broadcasts (only admins can broadcast)
        if (['team_activity', 'student_update', 'application_update', 'document_update'].includes(msg.type)) {
          const clientInfo = wsToTeam.get(ws);
          
          if (!clientInfo) {
            ws.send(JSON.stringify({ type: 'error', payload: 'Not authenticated' }));
            return;
          }
          
          // Broadcast to all team members
          broadcastToTeam(clientInfo.teamId, msg);
        }
      } catch (error) {
        console.error('[WS Partner] Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeatInterval);
      
      // Clean up team mapping
      const clientInfo = wsToTeam.get(ws);
      if (clientInfo) {
        const clients = teamClients.get(clientInfo.teamId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            teamClients.delete(clientInfo.teamId);
          }
        }
        wsToTeam.delete(ws);
        console.log(`[WS Partner] User ${clientInfo.userId} disconnected from team ${clientInfo.teamId}`);
      }
    });

    ws.on('error', (error) => {
      console.error('[WS Partner] WebSocket error:', error);
      clearInterval(heartbeatInterval);
    });
  });
}

/**
 * Broadcast a message to all members of a team
 */
export function broadcastToTeam(teamId: string, message: PartnerMessage): void {
  const clients = teamClients.get(teamId);
  if (!clients) return;

  const msgStr = JSON.stringify(message);
  
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msgStr);
    }
  });
}

/**
 * Send a message to a specific user in a team
 */
export function sendToTeamUser(teamId: string, userId: string, message: PartnerMessage): boolean {
  const clients = teamClients.get(teamId);
  if (!clients) return false;

  const msgStr = JSON.stringify(message);
  let sent = false;
  
  clients.forEach((ws) => {
    const clientInfo = wsToTeam.get(ws);
    if (clientInfo?.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(msgStr);
      sent = true;
    }
  });

  return sent;
}

/**
 * Get connected team members count
 */
export function getTeamMembersCount(teamId: string): number {
  return teamClients.get(teamId)?.size || 0;
}
