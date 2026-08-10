import express from 'express';
import User from '../models/User.js';
import { requireRoleMiddleware } from '../lib/requireRole.js';
import { getProbationEndDate } from '../lib/probation.js';
import { connectDB } from '../lib/mongodb.js';
import { sendAstrologerPromotionEmail } from '../lib/mailer.js';

const router = express.Router();

const ADMIN_TOP_LEVEL_FIELDS = ['name', 'walletBalance', 'isPremium', 'unlockedFeatures', 'referralBalance'];
const ADMIN_ASTROLOGER_FIELDS = [
  'specialization','languages','experienceYears','about','profileImage','pricePerMinute','isOnline','isVerified','isFeatured','certifications','probationEndsAt'
];

router.get('/:id', requireRoleMiddleware(['admin']), async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const user = await User.findById(id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/:id', requireRoleMiddleware(['admin']), async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const body = req.body;
    for (const key of ADMIN_TOP_LEVEL_FIELDS) {
      if (key in body) user[key] = body[key];
    }

    if (body.astrologerProfile && user.role === 'astrologer') {
      if (!user.astrologerProfile) user.astrologerProfile = {};
      for (const key of ADMIN_ASTROLOGER_FIELDS) {
        if (key in body.astrologerProfile) user.astrologerProfile[key] = body.astrologerProfile[key];
      }
    }

    await user.save();

    return res.json({ message: 'User updated', user: { _id: user._id, name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance, referralBalance: user.referralBalance, isPremium: user.isPremium, astrologerProfile: user.astrologerProfile } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/:id/role', requireRoleMiddleware(['admin']), async (req, res) => {
  try {
    await connectDB();
    const { id } = req.params;
    const { role } = req.body;
    if (!['user','astrologer','admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const wasAstrologer = user.role === 'astrologer';
    user.role = role;
    if (role === 'astrologer' && !wasAstrologer) {
      user.astrologerProfile = { ...(user.astrologerProfile || {}), probationEndsAt: getProbationEndDate() };
    }
    await user.save();

    // Fire-and-forget: let the admin's request finish immediately rather than
    // waiting on the mail server, and don't fail the whole promotion just
    // because the notification email couldn't be sent.
    if (role === 'astrologer' && !wasAstrologer) {
      sendAstrologerPromotionEmail(user.email, user.name).catch((err) => {
        console.error('Failed to send astrologer promotion email to', user.email, ':', err.message);
      });
    }

    return res.json({ message: 'Role updated', user: { _id: user._id, name: user.name, email: user.email, role: user.role, astrologerProfile: user.astrologerProfile } });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;