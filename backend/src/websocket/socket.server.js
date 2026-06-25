import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors:            { origin: '*', methods: ['GET', 'POST'] },
    pingTimeout:     60000,
    pingInterval:    25000,
    transports:      ['websocket', 'polling'],
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token'));
    try {
      const payload  = jwt.verify(token, ENV.JWT_SECRET);
      socket.userId  = payload.userId;
      socket.orgId   = payload.orgId;
      socket.role    = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, orgId, role } = socket;

    socket.join(`org:${orgId}`);

    if (['supervisor', 'org_admin', 'org_owner', 'platform_owner'].includes(role)) {
      socket.join(`admin:${orgId}`);
    }
    if (role === 'platform_owner') {
      socket.join('platform_admin');
    }

    console.log(`[WS] connected uid=${userId} org=${orgId} role=${role}`);

    socket.on('location_update', (data) => {
      socket.to(`admin:${orgId}`).emit('location_update', { userId, ...data });
    });

    socket.on('responder_status', (data) => {
      socket.to(`org:${orgId}`).emit('responder_status', { userId, ...data });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[WS] disconnected uid=${userId} reason=${reason}`);
    });
  });

  return io;
}

export function broadcastAlert(orgId, event, payload) {
  if (!io) return;
  io.to(`org:${orgId}`).emit(event, payload);
}

export function broadcastToAdmin(orgId, event, payload) {
  if (!io) return;
  io.to(`admin:${orgId}`).emit(event, payload);
}

export function broadcastPlatform(event, payload) {
  if (!io) return;
  io.to('platform_admin').emit(event, payload);
}

export function getIO() {
  return io;
}
