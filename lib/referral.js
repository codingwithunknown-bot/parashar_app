import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Transaction from '../models/Transaction.js';

// How many tokens each side of a referral gets. Configurable via env so it
// can be tuned without a code change/redeploy.
export const REFERRAL_BONUS_TOKENS = Number(process.env.REFERRAL_BONUS_TOKENS) || 50;

const CODE_LENGTH = 6;
const CODE_CHARS = '0123456789';

function randomCode() {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/**
 * Generates a 6-digit numeric code that isn't already taken. Collisions are
 * astronomically rare at this user count (1 in a million per attempt) but we
 * still guard against them instead of trusting the unique index alone.
 */
export async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = randomCode();
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ referralCode: code });
    if (!exists) return code;
  }
  throw new Error('Could not generate a unique referral code, please try again');
}

/**
 * Credits REFERRAL_BONUS_TOKENS to `referralBalance` for both the referrer
 * and the new user, and links `newUser.referredBy -> referrer`.
 *
 * Intentionally credits `referralBalance`, NOT `walletBalance` — chat
 * charges (services/chatService.js) only ever touch `walletBalance`, so
 * referral tokens can never be spent talking to an astrologer, only on
 * `unlockFeature` (faladesh / other in-app unlocks) which spends from
 * referralBalance first, then walletBalance.
 *
 * Safe to call at most once per referred user — callers must check
 * `newUser.referredBy` is still null before calling this.
 */
export async function creditReferralBonus({ referrer, newUser }) {
  const updatedNewUser = await User.findByIdAndUpdate(
    newUser._id,
    {
      $set: { referredBy: referrer._id },
      $inc: { referralBalance: REFERRAL_BONUS_TOKENS },
    },
    { returnDocument: 'after' }
  );

  const updatedReferrer = await User.findByIdAndUpdate(
    referrer._id,
    {
      $inc: { referralBalance: REFERRAL_BONUS_TOKENS, referralCount: 1 },
    },
    { returnDocument: 'after' }
  );

  await WalletTransaction.create({
    user: newUser._id,
    type: 'referral_bonus',
    amount: REFERRAL_BONUS_TOKENS,
    balanceAfter: updatedNewUser.referralBalance,
    description: `Referral bonus for joining with ${referrer.name}'s code`,
  });

  await WalletTransaction.create({
    user: referrer._id,
    type: 'referral_bonus',
    amount: REFERRAL_BONUS_TOKENS,
    balanceAfter: updatedReferrer.referralBalance,
    description: `Referral bonus for inviting ${newUser.name}`,
  });

  // Keep the older Transaction model (used by GET /billing/transactions) in sync too.
  await Transaction.create({
    userId: newUser._id,
    amount: REFERRAL_BONUS_TOKENS,
    type: 'credit',
    description: `Referral bonus for joining with ${referrer.name}'s code`,
  });
  await Transaction.create({
    userId: referrer._id,
    amount: REFERRAL_BONUS_TOKENS,
    type: 'credit',
    description: `Referral bonus for inviting ${newUser.name}`,
  });

  return { updatedNewUser, updatedReferrer };
}

/**
 * Looks up a referral code and applies its bonus to `newUser`, if valid.
 * Never throws for "just didn't work" cases (bad code, self-referral,
 * already-referred user) — returns a small result object instead, so
 * callers (e.g. signup) can attach a soft warning without failing the
 * whole request. Returns null if no code was supplied at all.
 */
export async function tryApplyReferralCode({ newUser, referralCode }) {
  if (!referralCode) return null;

  const code = String(referralCode).trim();
  if (!code) return null;

  if (newUser.referredBy) {
    return { applied: false, reason: 'You already used a referral code' };
  }

  const referrer = await User.findOne({ referralCode: code });
  if (!referrer) {
    return { applied: false, reason: 'Referral code not found' };
  }

  if (String(referrer._id) === String(newUser._id)) {
    return { applied: false, reason: 'You cannot use your own referral code' };
  }

  await creditReferralBonus({ referrer, newUser });
  return { applied: true, bonus: REFERRAL_BONUS_TOKENS, referrerName: referrer.name };
}
