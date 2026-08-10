import { Server } from 'socket.io';
import { verifyToken } from '../lib/auth.js';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import { setIO, personalRoom, sessionRoom } from './ioInstance.js';
import * as chatService from '../services/chatService.js';

function ackError(ack, err) {
  ack?.({ success: false, message: err.message || 'Something went wrong', ...(err.extra || {}) });
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: process.env.SOCKET_CORS_ORIGIN || '*' },
  });
  setIO(io);

  // Every socket must present a valid JWT (same one used for REST) before connecting.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyToken(token);
      await connectDB();
      const user = await User.findById(decoded.userId).select('name role');
      if (!user) return next(new Error('User not found'));
      socket.user = { id: user._id.toString(), role: user.role, name: user.name };
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user;

    // Every user has a personal room — used to push things like "new chat
    // request" (astrologer) or "chat activated" / "guest joined" (anyone),
    // independent of which session room(s) they're currently sitting in.
    socket.join(personalRoom(userId));

    if (role === 'astrologer') {
      User.updateOne({ _id: userId }, { 'astrologerProfile.lastActiveAt': new Date() }).catch(() => {});
    }

    socket.on('chat:request', async ({ astrologerId } = {}, ack) => {
      try {
        const session = await chatService.requestChat({ userId, astrologerId });
        ack?.({ success: true, session });
      } catch (err) {
        ackError(ack, err);
      }
    });

    socket.on('chat:join', async ({ sessionId } = {}, ack) => {
      try {
        const { session, role: myRole, messages } = await chatService.joinSession({ sessionId, userId });
        socket.join(sessionRoom(sessionId));
        ack?.({ success: true, session, role: myRole, messages });
      } catch (err) {
        ackError(ack, err);
      }
    });

    socket.on('chat:message', async ({ sessionId, text } = {}, ack) => {
      try {
        const message = await chatService.sendMessage({ sessionId, senderId: userId, text });
        ack?.({ success: true, message });
      } catch (err) {
        ackError(ack, err);
      }
    });

    socket.on('chat:typing', async ({ sessionId, isTyping } = {}) => {
      try {
        await chatService.setTyping({ sessionId, userId, isTyping });
      } catch (err) {
        // typing indicator failures aren't worth surfacing to the user
      }
    });

    socket.on('chat:renew', async ({ sessionId } = {}, ack) => {
      try {
        const session = await chatService.renewSession({ sessionId, userId });
        ack?.({ success: true, session });
      } catch (err) {
        ackError(ack, err);
      }
    });

    socket.on('chat:end', async ({ sessionId } = {}, ack) => {
      try {
        const session = await chatService.endSession({ sessionId, userId, reason: 'user' });
        ack?.({ success: true, session });
      } catch (err) {
        ackError(ack, err);
      }
    });

    socket.on('chat:invite', async ({ sessionId } = {}, ack) => {
      try {
        const invite = await chatService.createInvite({ sessionId, userId });
        ack?.({ success: true, ...invite });
      } catch (err) {
        ackError(ack, err);
      }
    });

    socket.on('chat:join-invite', async ({ code } = {}, ack) => {
      try {
        const { session, messages } = await chatService.joinInvite({ code, guestUserId: userId });
        socket.join(sessionRoom(session._id));
        ack?.({ success: true, session, role: 'guest', messages });
      } catch (err) {
        ackError(ack, err);
      }
    });

    socket.on('chat:leave-room', ({ sessionId } = {}) => {
      if (sessionId) socket.leave(sessionRoom(sessionId));
    });
  });

  // Expiry sweep — astrologer-never-replied timeouts + active sessions running out of time.
  chatService.startExpirySweep();

  return io;
}
