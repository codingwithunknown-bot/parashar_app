//routes/api.js
import express from 'express';
import { success, error } from '../lib/apiResponse.js';
import authRouter from './auth.js';
import functionsRouter from './functions.js';
import astrologersRouter from './astrologers.js';
import astrologerProfileRouter from './astrologerProfile.js';
import billingRouter from './billing.js';
import adminUsersRouter from './admin/users.js';
import adminUserIdRouter from './adminUserId.js';
import heartbeatRouter from './heartbeat.js';
import unlockFeatureRouter from './unlockFeature.js';
import chatRouter from './chat.js';
import referralRouter from './referral.js';

const router = express.Router();

router.get('/health', (req, res) => {
  return success(res, { status: 'ok' });
});

router.use('/auth', authRouter);
router.use('/functions', functionsRouter);
router.use('/astrologers', astrologersRouter);
router.use('/astrologer/profile', astrologerProfileRouter);
router.use('/billing', billingRouter);
router.use('/admin/users', adminUsersRouter);
router.use('/admin/users', adminUserIdRouter);
router.use('/astrologer/heartbeat', heartbeatRouter);
router.use('/billing/unlock-feature', unlockFeatureRouter);
router.use('/chat', chatRouter);
router.use('/referral', referralRouter);

// Catch-all placeholder for API endpoints to be converted from Next.js
router.all('/*', (req, res) => {
  return error(res, 'Not implemented yet in node-backend', 501);
});

export default router;
