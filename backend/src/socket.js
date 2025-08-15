import { Server } from 'socket.io';
import logger from './utils/logger.js';
import config from './config/env.js';

let io;

/**
 * Initialize Socket.IO server
 */
export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: config.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Connection event
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join general room
    socket.join('general');

    // Handle room joining
    socket.on('join-room', (room) => {
      socket.leaveAll();
      socket.join(room);
      logger.info(`Client ${socket.id} joined room: ${room}`);
    });

    // Handle room leaving
    socket.on('leave-room', (room) => {
      socket.leave(room);
      logger.info(`Client ${socket.id} left room: ${room}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for client ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO server initialized');
}

/**
 * Emit to specific wallet room
 */
export function emitToWallet(walletAddress, event, data) {
  if (io) {
    io.to(`wallet-${walletAddress}`).emit(event, data);
    logger.debug(`Emitted ${event} to wallet ${walletAddress}`);
  }
}

/**
 * Emit to general room
 */
export function emitToGeneral(event, data) {
  if (io) {
    io.to('general').emit(event, data);
    logger.debug(`Emitted ${event} to general room`);
  }
}

/**
 * Emit to stats room
 */
export function emitToStats(event, data) {
  if (io) {
    io.to('stats').emit(event, data);
    logger.debug(`Emitted ${event} to stats room`);
  }
}

/**
 * Emit to all connected clients
 */
export function emitToAll(event, data) {
  if (io) {
    io.emit(event, data);
    logger.debug(`Emitted ${event} to all clients`);
  }
}

/**
 * Get connected clients count
 */
export function getConnectedClientsCount() {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
}

/**
 * Get room members count
 */
export function getRoomMembersCount(room) {
  if (io && io.sockets.adapter.rooms.get(room)) {
    return io.sockets.adapter.rooms.get(room).size;
  }
  return 0;
}

export default io;
