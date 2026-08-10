// scripts/check-user-wallet.mjs
//
// Ground truth for "the user isn't getting debited" — reads straight from
// the database and shows exactly what happened on their recent chats:
// whether each one was correctly marked free/paid, what it charged, and
// what walletBalance actually is right now.
//
// Usage (run from the backend project root):
//   node scripts/check-user-wallet.mjs                       (lists all users)
//   node scripts/check-user-wallet.mjs --email=user@example.com
//   node scripts/check-user-wallet.mjs --id=<userObjectId>

import 'dotenv/config';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';
import WalletTransaction from '../models/WalletTransaction.js';
import ChatSession from '../models/ChatSession.js';

const emailArg = process.argv.find((a) => a.startsWith('--email='));
const idArg = process.argv.find((a) => a.startsWith('--id='));

async function main() {
  await connectDB();

  if (!emailArg && !idArg) {
    console.log('No --email= or --id= given — listing your users so you can pick one:\n');
    const all = await User.find({ role: { $ne: 'astrologer' } }).select('name email walletBalance freeSessionUsed');
    if (!all.length) {
      console.log('No non-astrologer user accounts exist in this database.');
      process.exit(1);
    }
    for (const u of all) {
      console.log(
        ` ${(u.name || '(no name)').padEnd(24)} ${u.email.padEnd(30)} walletBalance: ${String(u.walletBalance).padEnd(6)} freeSessionUsed: ${u.freeSessionUsed}`
      );
    }
    console.log('\nRe-run with:  node scripts/check-user-wallet.mjs --email=<one of the emails above>');
    process.exit(0);
  }

  const query = emailArg ? { email: emailArg.split('=')[1] } : { _id: idArg.split('=')[1] };
  const user = await User.findOne(query);

  if (!user) {
    console.error('No user found matching that query.');
    process.exit(1);
  }

  console.log('----------------------------------------');
  console.log('User:', user.name, `(${user.email})`);
  console.log('_id:', user._id.toString());
  console.log('CURRENT walletBalance:', user.walletBalance);
  console.log('freeSessionUsed:', user.freeSessionUsed, user.freeSessionUsed === undefined ? '  <-- MISSING FIELD ENTIRELY (legacy account, predates this field)' : '');
  console.log('----------------------------------------\n');

  console.log('Recent chat sessions this user started (most recent first):');
  const sessions = await ChatSession.find({ user: user._id }).sort({ createdAt: -1 }).limit(10).populate('astrologer', 'name');
  for (const s of sessions) {
    console.log(
      ' ', s._id.toString(),
      '| astrologer:', s.astrologer?.name || s.astrologer,
      '| status:', s.status,
      '| isFree:', s.isFree,
      '| cost:', s.cost,
      '| activatedAt:', s.activatedAt ? s.activatedAt.toISOString() : 'never',
      '| totalCost charged:', s.totalCost
    );
  }

  console.log('\nRecent debit transactions (chat_session / chat_renewal) for this user:');
  const debits = await WalletTransaction.find({
    user: user._id,
    type: { $in: ['chat_session', 'chat_renewal'] },
  }).sort({ createdAt: -1 }).limit(10);

  if (!debits.length) {
    console.log('  None found. If any of the sessions above show isFree: false and cost > 0 with');
    console.log('  activatedAt set, but there is no matching debit transaction here, that confirms');
    console.log('  chargeForBlock() is not actually deducting for this user — real bug, not just a');
    console.log('  free-first-chat situation.');
  } else {
    for (const t of debits) {
      console.log(
        ' ', t.createdAt.toISOString(),
        '| amount:', t.amount,
        '| balanceAfter recorded at the time:', t.balanceAfter,
        '| session:', t.session?.toString(),
        '|', t.description
      );
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Check script failed:', err);
  process.exit(1);
});
