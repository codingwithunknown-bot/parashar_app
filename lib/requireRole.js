import { connectDB } from './mongodb.js';
import User from '../models/User.js';
import { getUserIdFromReq, getUserId } from './getUserId.js';

export function requireRoleMiddleware(allowedRoles = []) {
  return async function (req, res, next) {
    try {
      await connectDB();
      const userId = getUserIdFromReq(req);
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      if (!allowedRoles.includes(user.role)) return res.status(403).json({ message: 'Forbidden' });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
}

export async function requireRole(req, allowedRoles) {
  await connectDB();
  const userId = getUserId(req);
  const user = await User.findById(userId);

  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  if (!allowedRoles.includes(user.role)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return user;
}
