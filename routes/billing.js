import express from 'express';
import Transaction from '../models/Transaction.js';
import { getUserIdFromReq } from '../lib/getUserId.js';
import { connectDB } from '../lib/mongodb.js';

const router = express.Router();

router.get('/transactions', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return res.json({ transactions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
