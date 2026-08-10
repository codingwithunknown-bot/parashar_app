// scripts/check-astrologer-earnings.mjs
//
// Answers, with certainty, whether the backend is actually crediting an
// astrologer's walletBalance or not — by reading straight from the database,
// bypassing whatever the app happens to be displaying (which could just be
// stale if it's not re-fetching after a chat).
//
// Usage (run from the backend project root):
//   node scripts/check-astrologer-earnings.mjs --email=astro@example.com
//   node scripts/check-astrologer-earnings.mjs --id=<astrologerObjectId>

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
    console.log('No --email= or --id= given — listing your astrologers so you can pick one:\n');
    const all = await User.find({ role: 'astrologer' }).select('name email walletBalance astrologerProfile.chatCostPerSession');
    if (!all.length) {
      console.log('No astrologer accounts exist in this database at all.');
      process.exit(1);
    }
    for (const a of all) {
      console.log(` ${a.name.padEnd(24)} ${a.email.padEnd(30)} walletBalance: ${a.walletBalance}`);
    }
    console.log('\nRe-run with:  node scripts/check-astrologer-earnings.mjs --email=<one of the emails above>');
    process.exit(0);
  }

  const query = emailArg ? { email: emailArg.split('=')[1] } : { _id: idArg.split('=')[1] };
  const astrologer = await User.findOne({ ...query, role: 'astrologer' });

  if (!astrologer) {
    console.error('No astrologer found matching that query.');
    process.exit(1);
  }

  console.log('----------------------------------------');
  console.log('Astrologer:', astrologer.name, `(${astrologer.email})`);
  console.log('_id:', astrologer._id.toString());
  console.log('CURRENT walletBalance (this is what /auth/me returns):', astrologer.walletBalance);
  console.log('CURRENT astrologerProfile.earningsBalance (lifetime stat, not shown in app):', astrologer.astrologerProfile?.earningsBalance);
  console.log('chatCostPerSession:', astrologer.astrologerProfile?.chatCostPerSession);
  console.log('----------------------------------------\n');

  const earnings = await WalletTransaction.find({ user: astrologer._id, type: 'chat_earning' })
    .sort({ createdAt: -1 })
    .limit(20);

  if (!earnings.length) {
    console.log('No chat_earning WalletTransaction records exist for this astrologer AT ALL.');
    console.log('This means chargeForBlock() never actually ran for any of their chats —');
    console.log('the problem is upstream of crediting (e.g. their sessions never activated,');
    console.log('or the chats being tested were free sessions, not paid ones).\n');
  } else {
    console.log(`Last ${earnings.length} chat_earning transaction(s) (most recent first):\n`);
    for (const t of earnings) {
      console.log(
        ' ', t.createdAt.toISOString(),
        '| amount: +' + t.amount,
        '| balanceAfter recorded at the time:', t.balanceAfter,
        '| session:', t.session?.toString(),
        '|', t.description
      );
    }
    console.log('\nIf the amounts above look correct but astrologer.walletBalance (printed above) does NOT');
    console.log('reflect the sum of these credits plus whatever they started with, something is overwriting');
    console.log('walletBalance elsewhere. If walletBalance DOES already reflect these credits correctly,');
    console.log('the backend is working — the issue is the app not re-fetching /auth/me to show it.');
  }

  console.log('\n----------------------------------------');
  console.log('Recent chat sessions for this astrologer:');
  const sessions = await ChatSession.find({ astrologer: astrologer._id }).sort({ createdAt: -1 }).limit(10);
  for (const s of sessions) {
    console.log(
      ' ', s._id.toString(),
      '| status:', s.status,
      '| isFree:', s.isFree,
      '| cost:', s.cost,
      '| activatedAt:', s.activatedAt ? s.activatedAt.toISOString() : 'never (astrologer did not respond)',
      '| totalAstrologerEarning:', s.totalAstrologerEarning
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Check script failed:', err);
  process.exit(1);
});
