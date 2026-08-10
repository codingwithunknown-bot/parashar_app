import express from 'express';
import { connectDB } from '../lib/mongodb.js';
import { getUserIdFromReq } from '../lib/getUserId.js';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import * as chatService from '../services/chatService.js';
import { HttpError } from '../services/chatService.js';

const router = express.Router();

function handleError(res, err) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message, ...err.extra });
  }
  console.error('Chat route error:', err);
  return res.status(500).json({ success: false, message: 'Something went wrong' });
}

// The user's current pending/active session (if any) — used to resume on app open.
router.get('/my-session', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const session = await ChatSession.findOne({ user: userId, status: { $in: ['pending', 'active'] } })
      .populate('astrologer', 'name astrologerProfile.profileImage astrologerProfile.isOnline');
    return res.json({ success: true, session });
  } catch (err) {
    return handleError(res, err);
  }
});

// The astrologer's current pending/active session (if any) — used to resume on app open.
router.get('/astrologer/current', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const session = await ChatSession.findOne({ astrologer: userId, status: { $in: ['pending', 'active'] } })
      .populate('user', 'name');
    return res.json({ success: true, session });
  } catch (err) {
    return handleError(res, err);
  }
});

// Fetch a session's current state + recent messages — used on (re)connect.
router.get('/session/:sessionId', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const { session, role, messages } = await chatService.joinSession({ sessionId: req.params.sessionId, userId });
    return res.json({ success: true, session, role, messages });
  } catch (err) {
    return handleError(res, err);
  }
});

router.post('/:sessionId/rate', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const { rating, comment } = req.body || {};
    const session = await chatService.rateSession({ sessionId: req.params.sessionId, userId, rating, comment });
    return res.json({ success: true, session });
  } catch (err) {
    return handleError(res, err);
  }
});

// REST fallback for ending a chat (socket 'chat:end' is the primary path).
router.post('/:sessionId/end', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const session = await chatService.endSession({ sessionId: req.params.sessionId, userId, reason: 'user' });
    return res.json({ success: true, session });
  } catch (err) {
    return handleError(res, err);
  }
});

export default router;
