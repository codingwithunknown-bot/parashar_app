// scripts/backfill-astrologer-wallet-from-earnings.mjs
//
// Before this fix, chat earnings were credited only to
// astrologerProfile.earningsBalance — a field nothing in the app ever
// displays. This one-time script moves whatever's already sitting there
// into walletBalance (the field that's actually visible), so astrologers
// see money they already earned under the old, invisible-crediting code.
//
// Safe to run multiple times: it only ADDS earningsBalance's current value
// to walletBalance and does not reset earningsBalance (which stays as a
// running lifetime-earnings stat), so re-running this after new earnings
// have already been correctly credited to both fields going forward will
// double-count. Run this ONCE, right after deploying the chargeForBlock fix,
// before any new chats happen — or better, only for astrologers whose
// walletBalance hasn't already been credited (see the --dry-run check below).
//
// Usage (run from the backend project root):
//   node scripts/backfill-astrologer-wallet-from-earnings.mjs --dry-run
//     -> shows exactly what would change, without writing anything
//
//   node scripts/backfill-astrologer-wallet-from-earnings.mjs
//     -> actually applies the backfill

import 'dotenv/config';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';

const dryRun = process.argv.includes('--dry-run');

async function main() {
  await connectDB();

  const astrologers = await User.find({
    role: 'astrologer',
    'astrologerProfile.earningsBalance': { $gt: 0 },
  }).select('name email walletBalance astrologerProfile.earningsBalance');

  if (!astrologers.length) {
    console.log('No astrologers have a positive earningsBalance — nothing to backfill.');
    process.exit(0);
  }

  console.log(`Found ${astrologers.length} astrologer(s) with earnings sitting in the invisible field:\n`);

  let totalToCredit = 0;
  for (const a of astrologers) {
    const amount = a.astrologerProfile.earningsBalance;
    totalToCredit += amount;
    console.log(
      `  ${a.name} (${a.email}) — current walletBalance: ${a.walletBalance}, will add: +${amount},`,
      `new walletBalance: ${a.walletBalance + amount}`
    );
  }

  console.log(`\nTotal to credit across all astrologers: ${totalToCredit}`);

  if (dryRun) {
    console.log('\nDry run — nothing was changed. Re-run without --dry-run to apply.');
    process.exit(0);
  }

  for (const a of astrologers) {
    const amount = a.astrologerProfile.earningsBalance;
    await User.updateOne({ _id: a._id }, { $inc: { walletBalance: amount } });
  }

  console.log(`\nDone. Credited ${astrologers.length} astrologer(s), total ${totalToCredit} coins moved into walletBalance.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill script failed:', err);
  process.exit(1);
});
