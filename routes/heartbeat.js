import express from 'express';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import { getUserIdFromReq } from '../lib/getUserId.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const user = await User.findOneAndUpdate(
      { _id: userId, role: 'astrologer' },
      { $set: { 'astrologerProfile.lastActiveAt': new Date() } },
      { returnDocument: 'after' }
    ).select('astrologerProfile.isOnline astrologerProfile.lastActiveAt');

    if (!user) return res.status(404).json({ message: 'Astrologer not found' });

    return res.json({ success: true, isOnline: user.astrologerProfile?.isOnline ?? false, lastActiveAt: user.astrologerProfile?.lastActiveAt });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

export default router;