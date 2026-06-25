import { Server } from 'socket.io';
import { verifyToken } from './services/jwt.service.js';

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors:          { origin: '*', methods: ['GET', 'POST'] },
    path:          '/socket.io',
    pingTimeout:   20000,
    pingInterval:  10000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        socket.user = verifyToken(token);
      } catch {
        socket.user = null;
      }
    }
    next();
  });

  io.on('connection', socket => {
    const orgCode = socket.user?.orgCode || 'DEFAULT';
    socket.join(orgCode);

    if (socket.user?.role === 'admin') socket.join('ADMIN');

    socket.on('subscribe', org => {
      if (org) socket.join(org);
    });

    socket.on('location_ping', data => {
      socket.to(orgCode).emit('location_update', {
        ...data,
        phone: socket.user?.phone || 'unknown',
        ts:    Date.now(),
      });
    });

    socket.on('disconnect', () => {});
  });

  return io;
}

export function broadcastAlert(orgCode, event, data) {
  if (!io) return;
  const room = orgCode || 'DEFAULT';
  io.to(room).emit(event, data);
  io.to('ADMIN').emit(event, data);
}

export function getIO() {
  return io;
}
