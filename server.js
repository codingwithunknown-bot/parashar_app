import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { connectDB } from './lib/mongodb.js';
import apiRouter from './routes/api.js';
import { initSocket } from './sockets/index.js';
import ChatSession from './models/ChatSession.js';

const app = express();
app.use(express.json());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

app.get('/', (req, res) => res.json({ ok: true, message: 'Kundali Node backend' }));

app.use('/api', apiRouter);

// Socket.IO needs to attach to the raw http server, not the express app directly.
const httpServer = createServer(app);
initSocket(httpServer);

const port = process.env.PORT || 4000;
async function start() {
  await connectDB();

  // Data repair: every ChatSession document created before this fix has
  // inviteCode explicitly set to `null` (from the schema's old `default:
  // null`). MongoDB's sparse index only excludes documents where a field is
  // completely ABSENT — an explicit null still counts as "present" for
  // indexing purposes. So as long as these null values sit in the data, the
  // unique sparse index on inviteCode will keep colliding on them regardless
  // of how correctly the index itself is built. This actually removes the
  // field (not just resets it) so the sparse index genuinely excludes these
  // documents. $unset on a query that also matches already-absent fields is
  // a safe no-op, so this is safe to run on every boot.
  try {
    const repairResult = await ChatSession.updateMany(
      { inviteCode: null },
      { $unset: { inviteCode: 1, inviteCodeExpiresAt: 1 } }
    );
    if (repairResult.modifiedCount > 0) {
      // console.log(`[startup] Repaired ${repairResult.modifiedCount} ChatSession document(s) with a stale null inviteCode.`);
    }
  } catch (err) {
    console.error('[startup] inviteCode data repair failed:', err);
  }

  // Reconcile ChatSession's indexes with what the schema actually declares.
  // Mongoose only CREATES indexes that are missing on boot — it never fixes
  // an index that already exists with different options, and in practice
  // syncIndexes()'s diffing can miss some option mismatches (e.g. `sparse`).
  // So rather than trust the diff, drop everything except _id_ and let
  // Mongoose recreate every index fresh from the schema every boot. This is
  // cheap (a handful of indexes on a modest collection) and guarantees the
  // live indexes can never silently drift from the code again.
  try {
    const before = await ChatSession.collection.indexes();
    // console.log('[startup] ChatSession indexes before rebuild:', JSON.stringify(before.map((i) => ({ name: i.name, key: i.key, unique: i.unique, sparse: i.sparse, partialFilterExpression: i.partialFilterExpression }))));

    for (const idx of before) {
      if (idx.name === '_id_') continue;
      await ChatSession.collection.dropIndex(idx.name);
    }

    const result = await ChatSession.syncIndexes();
    // console.log('[startup] ChatSession indexes rebuilt:', result);

    const after = await ChatSession.collection.indexes();
    // console.log('[startup] ChatSession indexes after rebuild:', JSON.stringify(after.map((i) => ({ name: i.name, key: i.key, unique: i.unique, sparse: i.sparse, partialFilterExpression: i.partialFilterExpression }))));
  } catch (err) {
    console.error('[startup] ChatSession index rebuild failed — indexes may still be drifted:', err);
  }

  // Pass '0.0.0.0' as the second argument to listen on all network interfaces
  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log(`Local network access: http://192.168.0.106:${port}`);
    console.log(`Socket.IO chat live on the same port`);
  });
}

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});