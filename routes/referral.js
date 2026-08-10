import express from 'express';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { getUserIdFromReq } from '../lib/getUserId.js';
import { generateUniqueReferralCode, tryApplyReferralCode, REFERRAL_BONUS_TOKENS } from '../lib/referral.js';

const router = express.Router();

/**
 * Everything the app needs to render the "Invite friends" screen: the
 * user's own shareable code, how many referral tokens they've earned,
 * how many friends they've referred, and a short list of who joined with
 * their code.
 */
router.get('/me', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Backfill for accounts created before the referral program existed.
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    const referredUsers = await User.find({ referredBy: user._id })
      .select('name createdAt')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({
      referralCode: user.referralCode,
      referralBalance: user.referralBalance,
      referralCount: user.referralCount,
      bonusPerReferral: REFERRAL_BONUS_TOKENS,
      hasUsedReferralCode: !!user.referredBy,
      referredUsers: referredUsers.map((u) => ({ name: u.name, joinedAt: u.createdAt })),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/**
 * Lets an already-registered user redeem a friend's referral code later
 * (e.g. they skipped it during signup). Works exactly like applying it at
 * signup — both sides get REFERRAL_BONUS_TOKENS credited to referralBalance
 * — but can only ever succeed once per account.
 */
router.post('/apply', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({ message: 'referralCode is required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.referredBy) {
      return res.status(400).json({ message: 'You already used a referral code' });
    }

    const result = await tryApplyReferralCode({ newUser: user, referralCode });

    if (!result?.applied) {
      return res.status(400).json({ message: result?.reason || 'Invalid referral code' });
    }

    const updated = await User.findById(userId);
    return res.json({
      message: `You and ${result.referrerName} each received ${result.bonus} tokens!`,
      referralBalance: updated.referralBalance,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

/** Recent referral bonus credits/spends for the current user's wallet history screen. */
router.get('/transactions', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const transactions = await WalletTransaction.find({ user: userId, type: 'referral_bonus' })
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json({ transactions });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
