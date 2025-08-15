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
      origin: ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175"], // allow multiple frontend ports
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

    // Handle wallet room joining for real-time updates
    socket.on('join-wallet', (walletAddress) => {
      socket.leaveAll();
      socket.join(`wallet-${walletAddress}`);
      socket.join('stats'); // Also join stats room for global updates
      logger.info(`Client ${socket.id} joined wallet room: ${walletAddress}`);
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
 * Emit real-time transaction update
 */
export function emitTransactionUpdate(walletAddress, transactionData) {
  if (io) {
    // Emit to the specific wallet room
    emitToWallet(walletAddress, 'transaction-update', transactionData);
    
    // Emit to stats room for global updates
    emitToStats('stats-update', {
      type: 'transaction',
      walletAddress,
      data: transactionData
    });
    
    logger.debug(`Emitted transaction update for wallet ${walletAddress}`);
  }
}

/**
 * Emit real-time balance update
 */
export function emitBalanceUpdate(walletAddress, balanceData) {
  if (io) {
    emitToWallet(walletAddress, 'balance-update', balanceData);
    logger.debug(`Emitted balance update for wallet ${walletAddress}`);
  }
}

/**
 * Emit real-time earnings update
 */
export function emitEarningsUpdate(walletAddress, earningsData) {
  if (io) {
    emitToWallet(walletAddress, 'earnings-update', earningsData);
    emitToStats('stats-update', {
      type: 'earnings',
      walletAddress,
      data: earningsData
    });
    logger.debug(`Emitted earnings update for wallet ${walletAddress}`);
  }
}

/**
 * Emit real-time leaderboard update
 */
export function emitLeaderboardUpdate(leaderboardData) {
  if (io) {
    emitToStats('leaderboard-update', leaderboardData);
    logger.debug('Emitted leaderboard update');
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
