// scripts/fix-chat-session-indexes.mjs
//
// The real bug: `inviteCode` is supposed to be a SPARSE unique index (only
// enforces uniqueness among sessions that actually have an invite code —
// most never do, and default to null). The index actually built in MongoDB
// is unique WITHOUT sparse, so every session's `inviteCode: null` collides
// as if it were the same value — meaning only the very first ChatSession
// document ever created could exist, and every insert after that fails with
// E11000 on { inviteCode: null }, surfacing as a false "astrologer busy".
//
// `ChatSession.syncIndexes()` is supposed to catch mismatches like this
// automatically, but its diffing didn't pick up the sparse difference here.
// So instead of relying on diffing, this script just drops every index
// except _id_ and lets Mongoose recreate them fresh, exactly as declared in
// the current schema (models/ChatSession.js) — guaranteed correct regardless
// of any diffing quirk.
//
// Usage (run from the backend project root):
//   node scripts/fix-chat-session-indexes.mjs

import 'dotenv/config';
import { connectDB } from '../lib/mongodb.js';
import ChatSession from '../models/ChatSession.js';

function summarize(indexes) {
  return indexes.map((i) => ({
    name: i.name,
    key: i.key,
    unique: Boolean(i.unique),
    sparse: Boolean(i.sparse),
    partialFilterExpression: i.partialFilterExpression || null,
  }));
}

async function main() {
  await connectDB();

  console.log('Current indexes on ChatSession collection:');
  const before = await ChatSession.collection.indexes();
  console.table(summarize(before));

  const inviteIndex = before.find((i) => i.name === 'inviteCode_1');
  if (inviteIndex && inviteIndex.unique && !inviteIndex.sparse) {
    console.log(
      '\nConfirmed the bug: "inviteCode_1" is unique but NOT sparse — every ChatSession with',
      'inviteCode: null (i.e. almost all of them) collides as duplicates on that null value.\n'
    );
  }

  console.log('Dropping every index except _id_ ...');
  for (const idx of before) {
    if (idx.name === '_id_') continue;
    console.log('  dropping', idx.name);
    await ChatSession.collection.dropIndex(idx.name);
  }

  console.log('\nRecreating indexes fresh from the current schema (models/ChatSession.js)...');
  const result = await ChatSession.syncIndexes();
  console.log('syncIndexes() result:', result);

  console.log('\nIndexes after rebuild:');
  const after = await ChatSession.collection.indexes();
  console.table(summarize(after));

  const fixedInvite = after.find((i) => i.name === 'inviteCode_1');
  if (fixedInvite?.sparse) {
    console.log('\n"inviteCode_1" is now correctly sparse. New chat requests should work normally.');
  } else {
    console.log('\nWARNING: "inviteCode_1" still does not show sparse:true — something else is going on, please share this output.');
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Fix script failed:', err);
  process.exit(1);
});
