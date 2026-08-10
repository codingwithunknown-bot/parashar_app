// scripts/check-user-duplicates.mjs
//
// Checks two things that would explain "the same account behaves
// inconsistently between requests": whether `email` is actually uniquely
// indexed in the live database (schemas declaring `unique: true` doesn't
// guarantee the live index matches, as we've already found twice tonight —
// see inviteCode and astrologer), and whether any duplicate-email User
// documents already exist as a result.
//
// Usage (run from the backend project root):
//   node scripts/check-user-duplicates.mjs

import 'dotenv/config';
import { connectDB } from '../lib/mongodb.js';
import User from '../models/User.js';

async function main() {
  await connectDB();

  console.log('Indexes on the User collection:');
  const indexes = await User.collection.indexes();
  console.table(indexes.map((i) => ({ name: i.name, key: i.key, unique: Boolean(i.unique) })));

  const emailIndex = indexes.find((i) => Object.keys(i.key).join(',') === 'email');
  if (!emailIndex || !emailIndex.unique) {
    console.log(
      '\nPROBLEM FOUND: there is no unique index on `email` in the live database, even though',
      'the schema declares `unique: true`. This means duplicate-email accounts can exist, and',
      'depending on which document a given request happens to read, behavior (like',
      'freeSessionUsed) can look inconsistent between different parts of the app.\n'
    );
  } else {
    console.log('\nGood — `email` does have a real unique index in the live database.\n');
  }

  console.log('Checking for actual duplicate-email documents...');
  const dupes = await User.aggregate([
    { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  if (!dupes.length) {
    console.log('No duplicate emails found — every email in the User collection is unique right now.');
  } else {
    console.log(`Found ${dupes.length} email(s) with multiple accounts:\n`);
    for (const d of dupes) {
      console.log(` ${d._id} — ${d.count} accounts: ${d.ids.map((id) => id.toString()).join(', ')}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Check script failed:', err);
  process.exit(1);
});
