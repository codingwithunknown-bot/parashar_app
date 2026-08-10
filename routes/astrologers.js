import express from 'express';
import User from '../models/User.js';
import { connectDB } from '../lib/mongodb.js';
import { isInProbation } from '../lib/probation.js';
import { getBusyAstrologerIds } from '../services/chatService.js';
import mongoose from 'mongoose';

const ONLINE_TIMEOUT_MS = 60 * 1000;
const PENDING_TIMEOUT_MS = 2 * 60 * 1000;

function computeStatus(doc, busySet) {
  const obj = doc.toObject ? doc.toObject() : doc;
  const profile = obj.astrologerProfile || {};
  const lastActiveAt = profile.lastActiveAt ? new Date(profile.lastActiveAt).getTime() : 0;
  const isRecentlyActive = Date.now() - lastActiveAt < ONLINE_TIMEOUT_MS;
  const effectiveIsOnline = Boolean(profile.isOnline) && isRecentlyActive;
  const isInChat = busySet.has(obj._id.toString());
  return {
    ...obj,
    astrologerProfile: { ...profile, isOnline: effectiveIsOnline, isInChat },
  };
}

function sortOnlineFirst(list) {
  return [...list].sort((a, b) => (b.astrologerProfile?.isOnline ? 1 : 0) - (a.astrologerProfile?.isOnline ? 1 : 0));
}

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    await connectDB();
    const baseFilter = { role: 'astrologer' };
    const projection = 'name astrologerProfile';

    const [featuredRaw, recommendedRaw, allRaw] = await Promise.all([
      User.find({ ...baseFilter, 'astrologerProfile.isFeatured': true }).select(projection).limit(10),
      User.find({ ...baseFilter, 'astrologerProfile.isVerified': true }).select(projection).sort({ 'astrologerProfile.rating': -1 }).limit(10),
      User.find(baseFilter).select(projection),
    ]);

    const busySet = await getBusyAstrologerIds();

    const featured = sortOnlineFirst(featuredRaw.map((d) => computeStatus(d, busySet)));
    const recommended = sortOnlineFirst(recommendedRaw.map((d) => computeStatus(d, busySet)));
    const all = sortOnlineFirst(allRaw.map((d) => computeStatus(d, busySet)));

    return res.json({ featured, recommended, all });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    await connectDB();
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid astrologer id' });
    }
    const astrologer = await User.findOne({ _id: req.params.id, role: 'astrologer' }).select('name astrologerProfile');
    if (!astrologer) {
      return res.status(404).json({ message: 'Astrologer not found' });
    }
    const busySet = await getBusyAstrologerIds();
    return res.json({ astrologer: computeStatus(astrologer, busySet) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
