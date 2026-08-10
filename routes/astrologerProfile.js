import express from 'express';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import { getUserIdFromReq } from '../lib/getUserId.js';
import { isInProbation, PROBATION_MAX_PRICE_PER_MINUTE, PROBATION_MAX_PRICE_PER_HOUR } from '../lib/probation.js';

const ALLOWED_FIELDS = [
  'specialization','languages','experienceYears','about','profileImage','pricePerMinute','isOnline','certifications','chatCostPerSession','sessionDurationMinutes'
];

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const user = await User.findById(userId).select('-password');
    if (!user || user.role !== 'astrologer') return res.status(404).json({ message: 'Astrologer profile not found' });
    return res.json({ name: user.name, email: user.email, role: user.role, astrologerProfile: user.astrologerProfile });
  } catch (err) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

router.patch('/', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserIdFromReq(req);
    const user = await User.findById(userId).select('role astrologerProfile');
    if (!user || user.role !== 'astrologer') return res.status(403).json({ message: 'Only astrologers can update this profile' });

    const body = req.body;
    if ('pricePerMinute' in body && isInProbation(user.astrologerProfile)) {
      const requested = Number(body.pricePerMinute);
      if (requested > PROBATION_MAX_PRICE_PER_MINUTE) {
        return res.status(400).json({ message: `New astrologers are capped at ₹${PROBATION_MAX_PRICE_PER_HOUR}/hour (₹${PROBATION_MAX_PRICE_PER_MINUTE}/min) for their first 30 days on the platform.`, probationEndsAt: user.astrologerProfile.probationEndsAt });
      }
    }

    // A targeted $set on specific dotted paths, NOT a fetch-mutate-full-save.
    // The old `user.save()` here wrote the ENTIRE document back exactly as it
    // was in memory at fetch time — including walletBalance/earningsBalance.
    // If a chat activation credited this astrologer (an atomic $inc,
    // elsewhere) while this request was in flight, that save would silently
    // overwrite the credit right back to its pre-credit value a moment
    // later. A $set on only these specific fields can never touch money.
    const setFields = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in body) setFields[`astrologerProfile.${key}`] = body[key];
    }
    if ('isOnline' in body && body.isOnline === true) {
      setFields['astrologerProfile.lastActiveAt'] = new Date();
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: setFields },
      { returnDocument: 'after' }
    ).select('astrologerProfile');

    return res.json({ message: 'Profile updated', astrologerProfile: updated.astrologerProfile });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;