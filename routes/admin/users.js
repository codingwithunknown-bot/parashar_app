import express from 'express';
import User from '../../models/User.js';
import { requireRoleMiddleware } from '../../lib/requireRole.js';

const router = express.Router();

router.get('/', requireRoleMiddleware(['admin']), async (req, res) => {
  try {
    const role = req.query.role;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select('name email role astrologerProfile createdAt');
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
