import express from 'express';
import bcrypt from 'bcryptjs';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import { generateToken, generateResetToken, verifyResetToken } from '../lib/auth.js';
import { verifyGoogleToken, verifyAppleToken } from '../lib/socialAuth.js';
import { sendOtpEmail, sendSocialAccountEmail } from '../lib/mailer.js';
import { getUserId } from '../lib/getUserId.js';
import { success, error } from '../lib/apiResponse.js';
import { generateUniqueReferralCode, tryApplyReferralCode } from '../lib/referral.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    await connectDB();
    const { name, email, password, role, astrologerProfile, referralCode } = req.body;

    if (!name || !email || !password) {
      return error(res, 'Name, email and password are required', 400);
    }

    const safeRole = role === 'astrologer' ? 'astrologer' : 'user';

    let user = await User.findOne({ email });

    if (user) {
      return error(res, 'User already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const ownReferralCode = await generateUniqueReferralCode();

    user = await User.create({
      name: name.trim(),
      email,
      password: hashedPassword,
      role: safeRole,
      referralCode: ownReferralCode,
      ...(safeRole === 'astrologer' && astrologerProfile ? { astrologerProfile } : {}),
    });

    // Best-effort — an invalid/self-referral code should never block signup.
    let referralResult = null;
    try {
      referralResult = await tryApplyReferralCode({ newUser: user, referralCode });
      if (referralResult?.applied) {
        // Bonus was credited straight to referralBalance in the DB — refresh
        // the in-memory doc so the response below reflects it.
        user = await User.findById(user._id);
      }
    } catch (refErr) {
      console.error('Referral apply error on signup:', refErr);
    }

    const token = generateToken(user._id);

    return success(res, {
      token,
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
        referralBalance: user.referralBalance,
        unlockedFeatures: user.unlockedFeatures || [],
        ...(user.role === 'astrologer' ? { astrologerProfile: user.astrologerProfile } : {}),
      },
      ...(referralResult && !referralResult.applied ? { referralWarning: referralResult.reason } : {}),
    }, 201);
  } catch (err) {
    return error(res, err.message || 'Server error', 500);
  }
});

router.post('/login', async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return error(res, 'Invalid credentials', 400);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return error(res, 'Invalid credentials', 400);
    }

    const token = generateToken(user._id);

    return success(res, {
      token,
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance,
        referralCode: user.referralCode,
        referralBalance: user.referralBalance,
        unlockedFeatures: user.unlockedFeatures || [],
        ...(user.role === 'astrologer' ? { astrologerProfile: user.astrologerProfile } : {}),
      },
    });
  } catch (err) {
    return error(res, err.message || 'Server error', 500);
  }
});

router.get('/me', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);

    let user = await User.findById(userId).select('-password');

    if (!user) {
      return error(res, 'User not found', 404);
    }

    // Backfill for accounts created before the referral program existed —
    // never generated on every /me call, only the one time it's missing.
    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    return success(res, {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      walletBalance: user.walletBalance,
      referralCode: user.referralCode,
      referralBalance: user.referralBalance,
      unlockedFeatures: user.unlockedFeatures || [],
      hasPassword: !!user.password,
      authProvider: user.authProvider,
      ...(user.role === 'astrologer' ? { astrologerProfile: user.astrologerProfile } : {}),
    });
  } catch (err) {
    return error(res, 'Unauthorized', 401);
  }
});

const GENERIC_MESSAGE = "If an account exists for this email, we've sent further instructions.";

router.post('/forgot-password', async (req, res) => {
  try {
    await connectDB();
    const { email } = req.body;

    if (!email) {
      return error(res, 'Email is required', 400);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user) {
      return success(res, { message: GENERIC_MESSAGE });
    }

    if (!user.password) {
      await sendSocialAccountEmail(user.email, user.authProvider);
      return success(res, { message: GENERIC_MESSAGE });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetOtp = await bcrypt.hash(otp, 10);
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOtpEmail(user.email, otp);

    return success(res, { message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('Forgot password error:', err);
    return error(res, err.message || 'Server error', 500);
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    await connectDB();
    const { email, otp } = req.body;

    if (!email || !otp) {
      return error(res, 'Email and code are required', 400);
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return error(res, 'Invalid or expired code', 400);
    }

    if (user.resetOtpExpires < new Date()) {
      return error(res, 'Otp has expired, please request a new one', 400);
    }

    const isMatch = await bcrypt.compare(otp, user.resetOtp);
    if (!isMatch) {
      return error(res, 'Invalid or expired Otp', 400);
    }

    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    const resetToken = generateResetToken(user._id);

    return success(res, { resetToken });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return error(res, err.message || 'Server error', 500);
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    await connectDB();
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return error(res, 'Missing required fields', 400);
    }

    if (newPassword.length < 6) {
      return error(res, 'Password must be at least 6 characters', 400);
    }

    let userId;
    try {
      userId = verifyResetToken(resetToken);
    } catch (e) {
      return error(res, 'Reset session expired, please start over', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      return error(res, 'User not found', 404);
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return success(res, { message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    return error(res, err.message || 'Server error', 500);
  }
});

router.patch('/password', async (req, res) => {
  try {
    await connectDB();
    const userId = getUserId(req);
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return error(res, 'New password must be at least 6 characters', 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      return error(res, 'User not found', 404);
    }

    const hasExistingPassword = !!user.password;

    if (hasExistingPassword) {
      if (!currentPassword) {
        return error(res, 'Current password is required', 400);
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return error(res, 'Current password is incorrect', 400);
      }
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return success(res, { message: hasExistingPassword ? 'Password updated successfully' : 'Password set successfully' });
  } catch (err) {
    console.error('Password update error:', err);
    return error(res, err.message || 'Server error', 500);
  }
});

router.post('/google', async (req, res) => {
  try {
    await connectDB();
    const { idToken, referralCode } = req.body;

    if (!idToken) {
      return error(res, 'idToken is required', 400);
    }

    const { googleId, email, name } = await verifyGoogleToken(idToken);

    if (!email) {
      return error(res, 'Google account has no email', 400);
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    let isNewUser = false;

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      if (!user.referralCode) {
        user.referralCode = await generateUniqueReferralCode();
        await user.save();
      }
    } else {
      isNewUser = true;
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        authProvider: 'google',
        role: 'user',
        referralCode: await generateUniqueReferralCode(),
      });
    }

    if (isNewUser) {
      try {
        const referralResult = await tryApplyReferralCode({ newUser: user, referralCode });
        if (referralResult?.applied) {
          user = await User.findById(user._id);
        }
      } catch (refErr) {
        console.error('Referral apply error on Google signup:', refErr);
      }
    }

    const token = generateToken(user._id);

    return success(res, { token, user: { name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance, referralCode: user.referralCode, referralBalance: user.referralBalance, unlockedFeatures: user.unlockedFeatures || [], ...(user.role === 'astrologer' ? { astrologerProfile: user.astrologerProfile } : {}) } });
  } catch (err) {
    console.error('Google auth error:', err);
    return error(res, 'Google authentication failed', 401);
  }
});

router.post('/apple', async (req, res) => {
  try {
    await connectDB();
    const { identityToken, fullName, referralCode } = req.body;

    if (!identityToken) {
      return error(res, 'identityToken is required', 400);
    }

    const { appleId, email } = await verifyAppleToken(identityToken);

    let user = await User.findOne({
      $or: [{ appleId }, ...(email ? [{ email }] : [])],
    });
    let isNewUser = false;

    if (user) {
      if (!user.appleId) {
        user.appleId = appleId;
        await user.save();
      }
      if (!user.referralCode) {
        user.referralCode = await generateUniqueReferralCode();
        await user.save();
      }
    } else {
      isNewUser = true;
      user = await User.create({
        name: fullName?.trim() || (email ? email.split('@')[0] : 'Apple User'),
        email: email || `${appleId}@appleid.privaterelay`,
        appleId,
        authProvider: 'apple',
        role: 'user',
        referralCode: await generateUniqueReferralCode(),
      });
    }

    if (isNewUser) {
      try {
        const referralResult = await tryApplyReferralCode({ newUser: user, referralCode });
        if (referralResult?.applied) {
          user = await User.findById(user._id);
        }
      } catch (refErr) {
        console.error('Referral apply error on Apple signup:', refErr);
      }
    }

    const token = generateToken(user._id);

    return success(res, { token, user: { name: user.name, email: user.email, role: user.role, walletBalance: user.walletBalance, referralCode: user.referralCode, referralBalance: user.referralBalance, unlockedFeatures: user.unlockedFeatures || [], ...(user.role === 'astrologer' ? { astrologerProfile: user.astrologerProfile } : {}) } });
  } catch (err) {
    console.error('Apple auth error:', err);
    return error(res, 'Apple authentication failed', 401);
  }
});

export default router;
