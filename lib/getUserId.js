import { verifyToken } from './auth.js';

export function getUserIdFromReq(req) {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) throw new Error('Authorization denied');
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  return decoded.userId;
}

export function getUserId(req) {
  const authHeader = req.headers?.authorization || req.headers?.Authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('Authorization denied');
    err.status = 401;
    throw err;
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  return decoded.userId;
}
