let io = null;

export function setIO(instance) {
  io = instance;
}

export function getIO() {
  if (!io) throw new Error('Socket.IO has not been initialized yet');
  return io;
}

export const sessionRoom = (sessionId) => `session:${sessionId}`;
export const personalRoom = (userId) => `user:${userId}`;
