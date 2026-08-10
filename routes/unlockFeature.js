import express from 'express';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { getUserIdFromReq } from '../lib/getUserId.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const { uniqueKundaliId, featureKey, tokenCost } = req.body;
    const purchaseKey = `${uniqueKundaliId}:${featureKey}`;

    const existing = await User.findById(userId).select('unlockedFeatures');
    if (!existing) return res.status(404).json({ message: 'User not found' });
    if (existing.unlockedFeatures.includes(purchaseKey)) {
      return res.status(400).json({ message: 'Feature already permanently unlocked for this chart.' });
    }

    // Feature unlocks (faladesh etc.) may be paid for out of EITHER pool:
    // walletBalance (real top-ups/earnings) or referralBalance (referral
    // bonus tokens). Referral tokens are spent first. Astrologer chat is
    // NOT affected by this — services/chatService.js only ever reads/writes
    // walletBalance, so referral tokens can never pay for a chat session.
    //
    // Atomic conditional update instead of fetch-mutate-full-save. The old
    // version read walletBalance into memory, decremented it in JS, then
    // wrote the WHOLE document back — if a chat charge/credit hit this same
    // user's walletBalance concurrently (an atomic $inc elsewhere), that
    // full-document save would silently overwrite it back to the stale
    // pre-fetch value. We keep that same atomic-write guarantee here: each
    // attempt's write only succeeds if both balances are still at least what
    // we read them as, and we retry on the (rare) conflict rather than ever
    // doing a full-document save.
    let updated = null;
    let referralSpend = 0;
    let walletSpend = tokenCost;

    for (let attempt = 0; attempt < 5 && !updated; attempt++) {
      const snapshot = await User.findById(userId).select('walletBalance referralBalance unlockedFeatures');
      if (!snapshot) return res.status(404).json({ message: 'User not found' });
      if (snapshot.unlockedFeatures.includes(purchaseKey)) {
        return res.status(400).json({ message: 'Feature already permanently unlocked for this chart.' });
      }

      const total = snapshot.walletBalance + snapshot.referralBalance;
      if (total < tokenCost) {
        return res.status(400).json({ message: 'Insufficient tokens. Please reload your wallet.' });
      }

      referralSpend = Math.min(snapshot.referralBalance, tokenCost);
      walletSpend = tokenCost - referralSpend;

      // eslint-disable-next-line no-await-in-loop
      updated = await User.findOneAndUpdate(
        {
          _id: userId,
          walletBalance: { $gte: walletSpend },
          referralBalance: { $gte: referralSpend },
          unlockedFeatures: { $ne: purchaseKey },
        },
        {
          $inc: { walletBalance: -walletSpend, referralBalance: -referralSpend },
          $push: { unlockedFeatures: purchaseKey },
        },
        { returnDocument: 'after' }
      );
    }

    if (!updated) {
      return res.status(400).json({ message: 'Insufficient tokens. Please reload your wallet.' });
    }

    await Transaction.create({ userId, amount: -tokenCost, type: 'spend', description: `Unlocked ${featureKey.toUpperCase()} feature` });
    return res.json({
      walletBalance: updated.walletBalance,
      referralBalance: updated.referralBalance,
      unlockedFeatures: updated.unlockedFeatures,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;