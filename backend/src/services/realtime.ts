import type { Server } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import logger from '../config/logger';
import type { AccessTokenPayload } from '../middlewares/authenticate';
import type { ChatMessage } from '../features/chat/chat.model';

interface BroadcastGroup {
  _id?: unknown;
  id?: string;
  memberIds?: string[];
}

const clientsByUser = new Map<string, Set<WebSocket>>();

let wss: WebSocketServer | null = null;

function registerSocket(userId: string, ws: WebSocket): void {
  if (!clientsByUser.has(userId)) {
    clientsByUser.set(userId, new Set());
  }
  clientsByUser.get(userId)!.add(ws);

  ws.on('close', () => {
    const sockets = clientsByUser.get(userId);
    if (!sockets) return;
    sockets.delete(ws);
    if (sockets.size === 0) {
      clientsByUser.delete(userId);
    }
  });
  ws.on('error', () => {
    // Ignore socket-level errors (e.g. aborted connections)
  });
}

export function attachRealtimeServer(server: Server): void {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    let payload: AccessTokenPayload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
    } catch {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const realtimeServer = wss as WebSocketServer;
    realtimeServer.handleUpgrade(req, socket, head, (ws) => {
      realtimeServer.emit('connection', ws, req, payload.sub);
    });
  });

  wss.on('connection', (ws: WebSocket, _req: unknown, userId: string) => {
    registerSocket(userId, ws);
    logger.debug({ userId }, 'realtime client connected');
  });

  wss.on('error', (err) => {
    logger.error({ err }, 'realtime websocket server error');
  });
}

function sendToUser(userId: string, event: string, data: unknown): void {
  const sockets = clientsByUser.get(userId);
  if (!sockets || sockets.size === 0) return;
  const frame = JSON.stringify({ event, data });
  for (const ws of sockets) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(frame);
    }
  }
}

/**
 * Broadcast a newly created chat message to every connected member of the group.
 * Public groups (memberIds includes 'all') reach every connected user.
 */
export function broadcastNewMessage(group: BroadcastGroup, message: ChatMessage): void {
  const memberIds = group.memberIds ?? [];
  const event = 'message:new';
  const data = { groupId: group._id?.toString() ?? group.id, message };

  if (memberIds.includes('all')) {
    for (const userId of clientsByUser.keys()) {
      sendToUser(userId, event, data);
    }
    return;
  }

  for (const memberId of memberIds) {
    sendToUser(memberId, event, data);
  }
}

/**
 * Broadcast an edited message event to all connected users in the group.
 */
export function broadcastEditedMessage(groupId: string, message: ChatMessage): void {
  const event = 'message:edited';
  const data = { groupId, message };

  for (const userId of clientsByUser.keys()) {
    sendToUser(userId, event, data);
  }
}

/**
 * Broadcast a deleted message event to all connected users in the group.
 */
export function broadcastDeletedMessage(groupId: string, messageId: string): void {
  const event = 'message:deleted';
  const data = { groupId, messageId };

  for (const userId of clientsByUser.keys()) {
    sendToUser(userId, event, data);
  }
}