import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server | null = null;

// userId → Set of socketIds (user can have multiple tabs)
const userSockets = new Map<string, Set<string>>();

interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next(new Error('Server configuration error'));
    }

    try {
      const decoded = jwt.verify(token as string, secret) as AuthPayload;
      socket.data.userId = decoded.id;
      socket.data.email = decoded.email;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;

    // Track this connection
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    console.log(`User ${userId} connected (socket: ${socket.id})`);

    // Join market rooms when user views a market page
    socket.on('join:market', (marketId: string) => {
      socket.join(`market:${marketId}`);
    });

    socket.on('leave:market', (marketId: string) => {
      socket.leave(`market:${marketId}`);
    });

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
      console.log(`User ${userId} disconnected (socket: ${socket.id})`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

/** Push a notification to a specific user */
export function pushToUser(userId: string, event: string, data: unknown) {
  if (!io) return;
  const sockets = userSockets.get(userId);
  if (sockets) {
    for (const socketId of sockets) {
      io.to(socketId).emit(event, data);
    }
  }
}

/** Broadcast to everyone viewing a specific market */
export function broadcastToMarket(marketId: string, event: string, data: unknown) {
  if (!io) return;
  io.to(`market:${marketId}`).emit(event, data);
}
