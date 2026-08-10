// scripts/backfill-referral-codes.mjs
//
// One-time helper for rolling out the referral program: assigns a unique
// 6-digit referralCode to every existing user who doesn't have one yet.
// New users get a code automatically at signup — this is only needed for
// accounts created before the referral program existed (the /me endpoint
// also backfills lazily, one user at a time, but this covers everyone in
// a single run so the whole install has codes before you launch invites).
//
// Usage (run from the backend project root):
//   node scripts/backfill-referral-codes.mjs

import 'dotenv/config';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import { generateUniqueReferralCode } from '../lib/referral.js';

async function main() {
  await connectDB();

  const users = await User.find({
    $or: [{ referralCode: { $exists: false } }, { referralCode: null }],
  }).select('_id name email');

  if (!users.length) {
    console.log('Every user already has a referral code — nothing to do.');
    process.exit(0);
  }

  console.log(`Backfilling referral codes for ${users.length} user(s)...`);

  let done = 0;
  for (const user of users) {
    const code = await generateUniqueReferralCode();
    await User.updateOne({ _id: user._id }, { $set: { referralCode: code } });
    done += 1;
    console.log(` [${done}/${users.length}] ${user.name || user.email} -> ${code}`);
  }

  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill script failed:', err);
  process.exit(1);
});
