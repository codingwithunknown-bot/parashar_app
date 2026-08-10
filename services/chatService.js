// import crypto from 'crypto';
// import ChatSession from '../models/ChatSession.js';
// import ChatMessage from '../models/ChatMessage.js';
// import User from '../models/User.js';
// import Transaction from '../models/Transaction.js';
// import WalletTransaction from '../models/WalletTransaction.js';
// import { getIO, sessionRoom, personalRoom } from '../sockets/ioInstance.js';

// export const ONLINE_TIMEOUT_MS = 60 * 1000; // matches routes/astrologers.js
// export const PENDING_TIMEOUT_MS = 2 * 60 * 1000; // astrologer must respond within 2 minutes
// const PLATFORM_CUT_PERCENT = Number(process.env.PLATFORM_CUT_PERCENT) || 20;

// // Every log line is prefixed so you can `grep '\[chat\]'` your server logs
// // and see the full story of a session end to end.
// const log = (...args) => console.log('[chat]', ...args);
// const logError = (...args) => console.error('[chat]', ...args);

// export class HttpError extends Error {
//   constructor(status, message, extra = {}) {
//     super(message);
//     this.status = status;
//     this.extra = extra;
//   }
// }

// function publicUser(u) {
//   if (!u) return null;
//   return { _id: u._id, name: u.name, astrologerProfile: u.astrologerProfile };
// }

// function resolveRole(session, userId) {
//   const uid = String(userId);
//   if (String(session.user) === uid) return 'user';
//   if (String(session.astrologer) === uid) return 'astrologer';
//   if (session.guest?.user && String(session.guest.user) === uid) return 'guest';
//   return null;
// }

// async function assertParticipant(sessionId, userId) {
//   const session = await ChatSession.findById(sessionId);
//   if (!session) {
//     log('assertParticipant: session', sessionId, 'not found');
//     throw new HttpError(404, 'Chat session not found');
//   }
//   const role = resolveRole(session, userId);
//   if (!role) {
//     log('assertParticipant: user', userId, 'is not a participant of session', sessionId);
//     throw new HttpError(403, 'You are not part of this chat session');
//   }
//   return { session, role };
// }

// /** Everyone who currently shows as "Busy" in the astrologer list. */
// export async function getBusyAstrologerIds() {
//   const ids = await ChatSession.distinct('astrologer', { status: { $in: ['pending', 'active'] } });
//   log('getBusyAstrologerIds:', ids.length, 'astrologer(s) currently busy:', ids.map(String));
//   return new Set(ids.map((id) => id.toString()));
// }

// /**
//  * User taps "Chat" on an astrologer. Creates the room (status: pending).
//  * No charge and no timer yet — that only happens once the astrologer replies.
//  */
// export async function requestChat({ userId, astrologerId }) {
//   log('requestChat: user', userId, '-> astrologer', astrologerId);

//   if (String(userId) === String(astrologerId)) {
//     throw new HttpError(400, 'You cannot start a chat with yourself');
//   }

//   // If this user already has a live (pending/active) request with this exact
//   // astrologer — e.g. they tapped Chat again while waiting for a reply, or
//   // reopened the app — just hand back that same session instead of trying to
//   // create a second one. Without this check, retrying your own unanswered
//   // request collides with the one-live-session-per-astrologer uniqueness
//   // constraint and looks identical to "astrologer is busy with someone else."
//   const existing = await ChatSession.findOne({
//     user: userId,
//     astrologer: astrologerId,
//     status: { $in: ['pending', 'active'] },
//   });
//   if (existing) {
//     log(
//       'requestChat: user already has a live session',
//       existing._id.toString(),
//       'with this astrologer (status:',
//       existing.status,
//       ', createdAt:',
//       existing.createdAt?.toISOString(),
//       ') — reusing it instead of creating a new one'
//     );
//     return existing;
//   }

//   const astrologer = await User.findById(astrologerId);
//   if (!astrologer || astrologer.role !== 'astrologer') {
//     log('requestChat: astrologer', astrologerId, 'not found or not an astrologer');
//     throw new HttpError(404, 'Astrologer not found');
//   }

//   const isRecentlyActive =
//     astrologer.astrologerProfile?.lastActiveAt &&
//     Date.now() - new Date(astrologer.astrologerProfile.lastActiveAt).getTime() < ONLINE_TIMEOUT_MS;
//   if (!astrologer.astrologerProfile?.isOnline || !isRecentlyActive) {
//     log(
//       'requestChat: astrologer', astrologerId, 'is offline (isOnline:',
//       astrologer.astrologerProfile?.isOnline, ', lastActiveAt:',
//       astrologer.astrologerProfile?.lastActiveAt, ')'
//     );
//     throw new HttpError(409, 'This astrologer is currently offline', { astrologerOffline: true });
//   }

//   // Analytics counter — fire and forget, doesn't gate anything below.
//   User.updateOne({ _id: astrologerId }, { $inc: { 'astrologerProfile.totalChatRequests': 1 } }).catch((err) =>
//     logError('requestChat: totalChatRequests counter failed (non-fatal):', err.message)
//   );

//   const user = await User.findById(userId);
//   if (!user) throw new HttpError(404, 'User not found');

//   const isFree = !user.freeSessionUsed;
//   const cost = isFree ? 0 : astrologer.astrologerProfile.chatCostPerSession || 0;
//   log(
//     'requestChat: user', String(user._id), 'raw freeSessionUsed =', user.freeSessionUsed,
//     '-> isFree =', isFree, ', cost =', cost, ', user balance =', user.walletBalance
//   );

//   if (!isFree && user.walletBalance < cost) {
//     log('requestChat: insufficient balance — needs', cost, 'has', user.walletBalance);
//     throw new HttpError(400, 'Insufficient coin balance to start this chat', {
//       insufficientBalance: true,
//       cost,
//       currentBalance: user.walletBalance,
//     });
//   }

//   let session;
//   try {
//     session = await ChatSession.create({
//       user: userId,
//       astrologer: astrologerId,
//       status: 'pending',
//       isFree,
//       cost,
//       durationMinutes: astrologer.astrologerProfile.sessionDurationMinutes || 5,
//       platformCutPercent: PLATFORM_CUT_PERCENT,
//     });
//     log('requestChat: created pending session', session._id.toString());
//   } catch (err) {
//     if (err.code === 11000) {
//       logError('requestChat: duplicate key error — raw keyPattern:', err.keyPattern, ', keyValue:', err.keyValue);

//       // Find out WHOSE session is actually blocking this, so logs answer the
//       // "but the astrologer isn't busy!" question immediately instead of
//       // requiring a manual DB lookup.
//       const blocker = await ChatSession.findOne({ astrologer: astrologerId, status: { $in: ['pending', 'active'] } });

//       if (blocker) {
//         log(
//           'requestChat: BLOCKED — astrologer', astrologerId, 'already has live session',
//           blocker._id.toString(), 'with user', String(blocker.user),
//           '(status:', blocker.status, ', createdAt:', blocker.createdAt?.toISOString(), ')'
//         );
//       } else {
//         // The unique index fired but no pending/active session exists for
//         // this astrologer — that means the ACTUAL index in MongoDB doesn't
//         // match the schema's partialFilterExpression (it's blocking on ANY
//         // session ever created, not just live ones). This happens when the
//         // index was built once and the schema changed later — Mongoose does
//         // not auto-repair a mismatched index, you have to reconcile it.
//         const mostRecent = await ChatSession.findOne({ astrologer: astrologerId }).sort({ createdAt: -1 });
//         logError(
//           'requestChat: DUPLICATE KEY FIRED BUT NO LIVE SESSION EXISTS. This means the MongoDB index on',
//           'ChatSession.astrologer does not match the schema (missing/wrong partialFilterExpression) —',
//           "it's blocking on ANY session ever created for this astrologer, not just pending/active ones.",
//           'Most recent session for this astrologer:', mostRecent?._id?.toString(),
//           '(status:', mostRecent?.status, ', endedAt:', mostRecent?.endedAt?.toISOString(), ').',
//           'Fix: restart the server (it now runs ChatSession.syncIndexes() on boot), or run',
//           'scripts/fix-chat-session-indexes.mjs directly.'
//         );
//       }

//       throw new HttpError(409, 'This astrologer is currently in another chat', { astrologerBusy: true });
//     }
//     logError('requestChat: unexpected error creating session:', err);
//     throw err;
//   }

//   getIO().to(personalRoom(astrologerId)).emit('chat:incoming', {
//     session,
//     user: publicUser(user),
//   });

//   return session;
// }

// /** Join / reconnect to a room's socket channel. Returns recent messages too. */
// export async function joinSession({ sessionId, userId }) {
//   const { session, role } = await assertParticipant(sessionId, userId);
//   log('joinSession: user', userId, 'joined session', sessionId, 'as', role, '(status:', session.status, ')');

//   // Populate whichever side the caller doesn't already know about, so the
//   // frontend gets a render-ready header (name, avatar, price, online status)
//   // in the same round-trip instead of a second fetch.
//   if (role === 'astrologer') {
//     await session.populate('user', 'name');
//   } else {
//     await session.populate(
//       'astrologer',
//       'name astrologerProfile.profileImage astrologerProfile.isOnline astrologerProfile.isVerified astrologerProfile.chatCostPerSession astrologerProfile.sessionDurationMinutes'
//     );
//   }

//   const messages = await ChatMessage.find({ session: sessionId }).sort({ createdAt: 1 }).limit(200);
//   return { session, role, messages };
// }

// async function chargeForBlock(session) {
//   const astrologerName = (await User.findById(session.astrologer).select('name')).name;
//   const userDoc = await User.findById(session.user).select('name');

//   if (session.isFree) {
//     log('chargeForBlock: session', session._id.toString(), 'is free — marking freeSessionUsed for user', session.user);
//     // No conditional guard here on purpose — matching {freeSessionUsed: false}
//     // silently fails for any user document that predates this field (it's
//     // missing entirely, not explicitly false, and Mongo equality queries
//     // don't treat "missing" as "false" the way they do for null). Since
//     // session.isFree was already decided once at request time, just set it.
//     const updateResult = await User.updateOne({ _id: session.user }, { $set: { freeSessionUsed: true } });
//     log('chargeForBlock: freeSessionUsed update — matchedCount:', updateResult.matchedCount, ', modifiedCount:', updateResult.modifiedCount);

//     // Read it straight back to prove the write actually persisted, rather
//     // than trusting the write acknowledgment alone.
//     const verify = await User.findById(session.user).select('freeSessionUsed');
//     log('chargeForBlock: VERIFIED freeSessionUsed immediately after write =', verify?.freeSessionUsed);
//     return { astrologerEarning: 0, platformCut: 0 };
//   }

//   const updatedUser = await User.findOneAndUpdate(
//     { _id: session.user, walletBalance: { $gte: session.cost } },
//     { $inc: { walletBalance: -session.cost } },
//     { returnDocument: 'after' }
//   );
//   if (!updatedUser) {
//     log('chargeForBlock: session', session._id.toString(), '— user balance too low for cost', session.cost);
//     throw new HttpError(402, 'User has insufficient balance for this chat block', { insufficientBalance: true });
//   }

//   const platformCut = Math.round((session.cost * session.platformCutPercent) / 100);
//   const astrologerEarning = session.cost - platformCut;

//   // Credit walletBalance — the field actually returned by login/profile/admin
//   // routes and shown in the app. earningsBalance is kept as a running
//   // lifetime-earnings stat (useful for a future earnings dashboard) but
//   // nothing currently exposes it, so crediting only that field left the
//   // money invisible to the astrologer even though it was correctly recorded.
//   const updatedAstrologer = await User.findByIdAndUpdate(
//     session.astrologer,
//     { $inc: { walletBalance: astrologerEarning, 'astrologerProfile.earningsBalance': astrologerEarning } },
//     { returnDocument: 'after' }
//   );

//   log(
//     'chargeForBlock: session', session._id.toString(), '— charged user', session.cost,
//     '-> astrologer earns', astrologerEarning, '(platform cut', platformCut, ') new astrologer walletBalance =', updatedAstrologer.walletBalance
//   );

//   await WalletTransaction.create({
//     user: session.user,
//     type: session.renewalCount > 0 ? 'chat_renewal' : 'chat_session',
//     amount: -session.cost,
//     balanceAfter: updatedUser.walletBalance,
//     astrologer: session.astrologer,
//     session: session._id,
//     description: `Chat with ${astrologerName}`,
//   });

//   await WalletTransaction.create({
//     user: session.astrologer,
//     type: 'chat_earning',
//     amount: astrologerEarning,
//     balanceAfter: updatedAstrologer.walletBalance,
//     astrologer: session.astrologer,
//     session: session._id,
//     description: `Chat earning from ${userDoc.name} (platform fee ${platformCut})`,
//   });

//   // Keep the older Transaction model (used by GET /billing/transactions) in sync too.
//   await Transaction.create({ userId: session.user, amount: session.cost, type: 'spend', description: `Chat with ${astrologerName}` });
//   await Transaction.create({ userId: session.astrologer, amount: astrologerEarning, type: 'credit', description: `Chat earning from ${userDoc.name}` });

//   return { astrologerEarning, platformCut };
// }

// async function activateSession(session) {
//   log('activateSession: activating session', session._id.toString());
//   const { astrologerEarning } = await chargeForBlock(session);

//   const now = new Date();
//   session.status = 'active';
//   session.activatedAt = now;
//   session.expiresAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);
//   session.totalCost += session.cost;
//   session.totalAstrologerEarning += astrologerEarning;
//   await session.save();
//   log('activateSession: session', session._id.toString(), 'now active, expiresAt =', session.expiresAt.toISOString());

//   getIO().to(sessionRoom(session._id)).emit('chat:activated', { session });
//   return session;
// }

// /** Send a message. If this is the astrologer's first message on a pending session, activates it first. */
// export async function sendMessage({ sessionId, senderId, text }) {
//   const trimmed = (text || '').trim();
//   if (!trimmed) throw new HttpError(400, 'Message text is required');

//   const { session, role } = await assertParticipant(sessionId, senderId);

//   if (session.status === 'ended') {
//     log('sendMessage: rejected — session', sessionId, 'has already ended');
//     throw new HttpError(409, 'This chat has ended');
//   }

//   if (session.status === 'pending') {
//     if (role === 'astrologer') {
//       log("sendMessage: astrologer's first message on session", sessionId, '— activating');
//       await activateSession(session);
//     } else {
//       log('sendMessage:', role, 'messaged a still-pending session', sessionId, '— fine, timer not started yet');
//     }
//   }

//   const senderDoc = await User.findById(senderId).select('name');
//   const message = await ChatMessage.create({
//     session: sessionId,
//     senderId,
//     senderRole: role,
//     senderName: senderDoc?.name || '',
//     text: trimmed,
//   });

//   await ChatSession.updateOne(
//     { _id: sessionId },
//     { $set: { lastMessageAt: message.createdAt, lastMessagePreview: trimmed.slice(0, 120) } }
//   );

//   getIO().to(sessionRoom(sessionId)).emit('chat:message', { message });
//   return message;
// }

// export async function setTyping({ sessionId, userId, isTyping }) {
//   const { role } = await assertParticipant(sessionId, userId);
//   getIO().to(sessionRoom(sessionId)).except(personalRoom(userId)).emit('chat:typing', {
//     sessionId,
//     role,
//     isTyping: Boolean(isTyping),
//   });
//   return true;
// }

// /** User extends an active session (or reopens one that just expired) for another paid block. */
// export async function renewSession({ sessionId, userId }) {
//   const { session, role } = await assertParticipant(sessionId, userId);
//   if (role !== 'user') throw new HttpError(403, 'Only the user can renew a session');

//   log('renewSession: session', sessionId, 'current status:', session.status, ', endedBy:', session.endedBy);

//   const canRenew =
//     session.status === 'active' ||
//     (session.status === 'ended' && session.endedBy === 'expired' && Date.now() - new Date(session.endedAt).getTime() < 2 * 60 * 1000);

//   if (!canRenew) {
//     log('renewSession: session', sessionId, 'can no longer be renewed');
//     throw new HttpError(409, 'This session can no longer be renewed — start a new chat instead');
//   }

//   const astrologer = await User.findById(session.astrologer);
//   session.cost = astrologer.astrologerProfile.chatCostPerSession || session.cost;
//   session.durationMinutes = astrologer.astrologerProfile.sessionDurationMinutes || session.durationMinutes;
//   session.isFree = false; // only the very first activation of a user's very first chat is ever free
//   session.renewalCount += 1;

//   if (session.status === 'ended') {
//     log('renewSession: session', sessionId, 'was ended-by-expiry — reopening the same room');
//     // Re-open the same room. This can legitimately fail if someone else grabbed
//     // the astrologer in the gap — the unique index protects us either way.
//     try {
//       const { astrologerEarning } = await chargeForBlock(session);
//       const now = new Date();
//       session.status = 'active';
//       session.endedAt = null;
//       session.endedBy = null;
//       session.activatedAt = now;
//       session.expiresAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);
//       session.totalCost += session.cost;
//       session.totalAstrologerEarning += astrologerEarning;
//       await session.save();
//       log('renewSession: session', sessionId, 'reopened, new expiresAt =', session.expiresAt.toISOString());
//     } catch (err) {
//       if (err.code === 11000) {
//         log('renewSession: session', sessionId, '— astrologer got grabbed by someone else in the gap');
//         throw new HttpError(409, 'This astrologer is now busy with someone else', { astrologerBusy: true });
//       }
//       logError('renewSession: unexpected error reopening session', sessionId, err);
//       throw err;
//     }
//   } else {
//     const { astrologerEarning } = await chargeForBlock(session);
//     session.expiresAt = new Date(session.expiresAt.getTime() + session.durationMinutes * 60 * 1000);
//     session.totalCost += session.cost;
//     session.totalAstrologerEarning += astrologerEarning;
//     await session.save();
//     log('renewSession: session', sessionId, 'extended, new expiresAt =', session.expiresAt.toISOString());
//   }

//   getIO().to(sessionRoom(sessionId)).emit('chat:renewed', { session });
//   return session;
// }

// export async function creditConsultationIfActivated(session) {
//   if (!session.activatedAt) return;
//   try {
//     await User.updateOne(
//       { _id: session.astrologer },
//       { $inc: { 'astrologerProfile.totalConsultations': 1 } }
//     );
//     log('creditConsultationIfActivated: astrologer', session.astrologer.toString(), 'totalConsultations +1 (session', session._id.toString(), ')');
//   } catch (err) {
//     logError('creditConsultationIfActivated: failed for session', session._id.toString(), ':', err);
//   }
// }

// /** Only the user can end a chat early — they paid for the block, astrologer just reflects it ending. */
// export async function endSession({ sessionId, userId, reason = 'user' }) {
//   log('endSession: called for session', sessionId, 'by', userId, 'reason:', reason);
//   const { session, role } = await assertParticipant(sessionId, userId);
//   if (reason === 'user' && role !== 'user') {
//     log('endSession: rejected — caller is', role, 'not the user');
//     throw new HttpError(403, 'Only the user can end this chat');
//   }
//   if (session.status === 'ended') {
//     log('endSession: session', sessionId, 'was already ended — no-op');
//     return session;
//   }

//   session.status = 'ended';
//   session.endedAt = new Date();
//   session.endedBy = reason;

//   try {
//     await session.save();
//   } catch (err) {
//     // This is exactly the kind of failure that used to be silently swallowed
//     // by the frontend and left the session stuck "active" forever — surface
//     // it loudly here so it's never a mystery again.
//     logError('endSession: FAILED TO SAVE session', sessionId, '— it is still live in the DB:', err);
//     throw err;
//   }

//   await creditConsultationIfActivated(session);

//   log('endSession: session', sessionId, 'successfully ended (astrologer is now free)');
//   getIO().to(sessionRoom(sessionId)).emit('chat:ended', { sessionId, endedBy: reason });
//   return session;
// }

// export async function rateSession({ sessionId, userId, rating, comment }) {
//   const { session, role } = await assertParticipant(sessionId, userId);
//   if (role !== 'user') throw new HttpError(403, 'Only the user can rate this chat');
//   if (session.status !== 'ended') throw new HttpError(409, 'You can only rate a chat after it has ended');
//   if (!session.activatedAt) {
//     // activatedAt only ever gets set the moment the astrologer sends their
//     // first message. If it's still null, the astrologer never actually
//     // joined/responded — whether the session timed out, the user gave up
//     // and left, or anything disconnected before that point, there's no
//     // astrologer interaction to rate.
//     log('rateSession: session', sessionId, 'was never activated — astrologer never joined, refusing rating');
//     throw new HttpError(409, 'The astrologer never joined this chat, so there is nothing to rate', { neverActivated: true });
//   }
//   if (session.rating != null) throw new HttpError(409, 'This session has already been rated');

//   const numericRating = Number(rating);
//   if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
//     throw new HttpError(400, 'Rating must be an integer between 1 and 5');
//   }

//   session.rating = numericRating;
//   session.ratingComment = (comment || '').trim();
//   session.ratedAt = new Date();
//   await session.save();
//   log('rateSession: session', sessionId, 'rated', numericRating, 'stars');

//   // Best-effort running average on the astrologer's profile.
//   const astrologer = await User.findById(session.astrologer).select('astrologerProfile.rating astrologerProfile.ratingCount astrologerProfile.totalReviews');
//   const prevCount = astrologer.astrologerProfile.ratingCount || 0;
//   const prevAvg = astrologer.astrologerProfile.rating || 0;
//   const newCount = prevCount + 1;
//   const newAvg = (prevAvg * prevCount + numericRating) / newCount;

//   await User.updateOne(
//     { _id: session.astrologer },
//     {
//       $set: { 'astrologerProfile.rating': Number(newAvg.toFixed(2)), 'astrologerProfile.ratingCount': newCount },
//       $inc: { 'astrologerProfile.totalReviews': 1 },
//     }
//   );

//   return session;
// }

// /** Generates a one-time shareable invite code so the user can pull exactly one extra guest in. */
// export async function createInvite({ sessionId, userId }) {
//   const { session, role } = await assertParticipant(sessionId, userId);
//   if (role !== 'user') throw new HttpError(403, 'Only the user can invite a guest');
//   if (session.status === 'ended') throw new HttpError(409, 'This chat has already ended');
//   if (session.guest?.user) throw new HttpError(409, 'A guest has already joined this chat');

//   let code;
//   for (let attempt = 0; attempt < 5; attempt++) {
//     code = crypto.randomBytes(4).toString('hex');
//     const clash = await ChatSession.exists({ inviteCode: code });
//     if (!clash) break;
//     code = null;
//   }
//   if (!code) throw new HttpError(500, 'Could not generate a unique invite code, try again');

//   session.inviteCode = code;
//   session.inviteCodeExpiresAt = session.expiresAt || new Date(Date.now() + 10 * 60 * 1000);
//   await session.save();
//   log('createInvite: session', sessionId, 'invite code', code, 'expires', session.inviteCodeExpiresAt.toISOString());

//   return { code, expiresAt: session.inviteCodeExpiresAt };
// }

// export async function joinInvite({ code, guestUserId }) {
//   const session = await ChatSession.findOne({ inviteCode: code });
//   if (!session) throw new HttpError(404, 'Invalid or expired invite link');
//   if (session.inviteCodeExpiresAt && session.inviteCodeExpiresAt < new Date()) {
//     throw new HttpError(410, 'This invite link has expired');
//   }
//   if (!['pending', 'active'].includes(session.status)) throw new HttpError(409, 'This chat has already ended');
//   if (session.guest?.user) throw new HttpError(409, 'This chat already has a guest');
//   if ([String(session.user), String(session.astrologer)].includes(String(guestUserId))) {
//     throw new HttpError(400, 'You are already part of this chat');
//   }

//   session.guest = { user: guestUserId, joinedAt: new Date() };
//   await session.save();

//   // Genuinely unset the field (not just set it to null) — a null value would
//   // still be "present" as far as the sparse unique index is concerned, and
//   // could collide with the next session that also has no invite code.
//   await ChatSession.updateOne({ _id: session._id }, { $unset: { inviteCode: 1, inviteCodeExpiresAt: 1 } });
//   session.inviteCode = undefined;
//   session.inviteCodeExpiresAt = undefined;

//   log('joinInvite: guest', guestUserId, 'joined session', session._id.toString());

//   const guest = await User.findById(guestUserId).select('name');
//   getIO().to(sessionRoom(session._id)).emit('chat:guest-joined', { sessionId: session._id, guest: publicUser(guest) });

//   await session.populate('astrologer', 'name astrologerProfile.profileImage astrologerProfile.isOnline');
//   const messages = await ChatMessage.find({ session: session._id }).sort({ createdAt: 1 }).limit(200);
//   return { session, messages };
// }

// /**
//  * Ends one stale session and reports success/failure — pulled out of the sweep
//  * loop so that ONE bad document (a validation error, corrupted data, whatever)
//  * can never abort the whole batch. Before this, a single failing `.save()`
//  * threw past the `for` loop straight into the outer try/catch, which silently
//  * skipped every other session in that tick AND every tick after, for as long
//  * as that one bad document existed — which is exactly the kind of bug that
//  * looks like "the timeout just doesn't work" from the outside.
//  */
// async function forceEndOne(session, reason) {
//   try {
//     session.status = 'ended';
//     session.endedAt = new Date();
//     session.endedBy = 'expired';
//     await session.save();
//     log('sweep: session', session._id.toString(), 'auto-ended —', reason);

//     await creditConsultationIfActivated(session);

//     getIO().to(sessionRoom(session._id)).emit('chat:ended', {
//       sessionId: session._id,
//       endedBy: 'expired',
//       reason,
//     });
//     return true;
//   } catch (err) {
//     logError('sweep: FAILED to end session', session._id.toString(), '— it will be retried next tick. Error:', err);
//     return false;
//   }
// }

// /**
//  * Periodic sweep — replaces per-session timers with one cheap query pair every
//  * few seconds. Handles: astrologer never replying (pending timeout) and active
//  * sessions that simply ran out of time.
//  */
// export function startExpirySweep({ intervalMs = 15000 } = {}) {
//   log(`expiry sweep started — checking every ${intervalMs / 1000}s`);

//   const timer = setInterval(async () => {
//     try {
//       const now = new Date();

//       const expiredActive = await ChatSession.find({ status: 'active', expiresAt: { $lte: now } });
//       if (expiredActive.length) log('sweep: found', expiredActive.length, 'expired active session(s)');
//       for (const session of expiredActive) {
//         await forceEndOne(session, 'active session ran out of time');
//       }

//       const staleNessCutoff = new Date(now.getTime() - PENDING_TIMEOUT_MS);
//       const stalePending = await ChatSession.find({ status: 'pending', createdAt: { $lte: staleNessCutoff } });
//       if (stalePending.length) log('sweep: found', stalePending.length, 'stale pending session(s) (astrologer never replied)');
//       for (const session of stalePending) {
//         await forceEndOne(session, 'Astrologer did not respond in time');
//       }
//     } catch (err) {
//       // With per-session handling above, this should now only ever catch
//       // errors in the find() queries themselves — never a single doc's save
//       // taking down the whole tick.
//       logError('expiry sweep tick failed:', err);
//     }
//   }, intervalMs);

//   return () => clearInterval(timer);
// }




import crypto from 'crypto';
import ChatSession from '../models/ChatSession.js';
import ChatMessage from '../models/ChatMessage.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import WalletTransaction from '../models/WalletTransaction.js';
import { getIO, sessionRoom, personalRoom } from '../sockets/ioInstance.js';

export const ONLINE_TIMEOUT_MS = 60 * 1000; // matches routes/astrologers.js
export const PENDING_TIMEOUT_MS = 2 * 60 * 1000; // astrologer must respond within 2 minutes
const PLATFORM_CUT_PERCENT = Number(process.env.PLATFORM_CUT_PERCENT) || 20;

const logError = (...args) => console.error('[chat]', ...args);

export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

function publicUser(u) {
  if (!u) return null;
  return { _id: u._id, name: u.name, astrologerProfile: u.astrologerProfile };
}

function resolveRole(session, userId) {
  const uid = String(userId);
  if (String(session.user) === uid) return 'user';
  if (String(session.astrologer) === uid) return 'astrologer';
  if (session.guest?.user && String(session.guest.user) === uid) return 'guest';
  return null;
}

async function assertParticipant(sessionId, userId) {
  const session = await ChatSession.findById(sessionId);
  if (!session) {
    throw new HttpError(404, 'Chat session not found');
  }
  const role = resolveRole(session, userId);
  if (!role) {
    throw new HttpError(403, 'You are not part of this chat session');
  }
  return { session, role };
}

/** Everyone who currently shows as "Busy" in the astrologer list. */
export async function getBusyAstrologerIds() {
  const ids = await ChatSession.distinct('astrologer', { status: { $in: ['pending', 'active'] } });
  return new Set(ids.map((id) => id.toString()));
}

/**
 * User taps "Chat" on an astrologer. Creates the room (status: pending).
 * No charge and no timer yet — that only happens once the astrologer replies.
 */
export async function requestChat({ userId, astrologerId }) {
  if (String(userId) === String(astrologerId)) {
    throw new HttpError(400, 'You cannot start a chat with yourself');
  }

  // If this user already has a live (pending/active) request with this exact
  // astrologer — e.g. they tapped Chat again while waiting for a reply, or
  // reopened the app — just hand back that same session instead of trying to
  // create a second one. Without this check, retrying your own unanswered
  // request collides with the one-live-session-per-astrologer uniqueness
  // constraint and looks identical to "astrologer is busy with someone else."
  const existing = await ChatSession.findOne({
    user: userId,
    astrologer: astrologerId,
    status: { $in: ['pending', 'active'] },
  });
  if (existing) {
    return existing;
  }

  const astrologer = await User.findById(astrologerId);
  if (!astrologer || astrologer.role !== 'astrologer') {
    throw new HttpError(404, 'Astrologer not found');
  }

  const isRecentlyActive =
    astrologer.astrologerProfile?.lastActiveAt &&
    Date.now() - new Date(astrologer.astrologerProfile.lastActiveAt).getTime() < ONLINE_TIMEOUT_MS;
  if (!astrologer.astrologerProfile?.isOnline || !isRecentlyActive) {
    throw new HttpError(409, 'This astrologer is currently offline', { astrologerOffline: true });
  }

  // Analytics counter — fire and forget, doesn't gate anything below.
  User.updateOne({ _id: astrologerId }, { $inc: { 'astrologerProfile.totalChatRequests': 1 } }).catch((err) =>
    logError('requestChat: totalChatRequests counter failed (non-fatal):', err.message)
  );

  const user = await User.findById(userId);
  if (!user) throw new HttpError(404, 'User not found');

  const isFree = !user.freeSessionUsed;
  const cost = isFree ? 0 : astrologer.astrologerProfile.chatCostPerSession || 0;

  if (!isFree && user.walletBalance < cost) {
    throw new HttpError(400, 'Insufficient coin balance to start this chat', {
      insufficientBalance: true,
      cost,
      currentBalance: user.walletBalance,
    });
  }

  let session;
  try {
    session = await ChatSession.create({
      user: userId,
      astrologer: astrologerId,
      status: 'pending',
      isFree,
      cost,
      durationMinutes: astrologer.astrologerProfile.sessionDurationMinutes || 5,
      platformCutPercent: PLATFORM_CUT_PERCENT,
    });
  } catch (err) {
    if (err.code === 11000) {
      logError('requestChat: duplicate key error — raw keyPattern:', err.keyPattern, ', keyValue:', err.keyValue);

      // Find out WHOSE session is actually blocking this, so logs answer the
      // "but the astrologer isn't busy!" question immediately instead of
      // requiring a manual DB lookup.
      const blocker = await ChatSession.findOne({ astrologer: astrologerId, status: { $in: ['pending', 'active'] } });

      if (blocker) {
        logError(
          'requestChat: BLOCKED — astrologer', astrologerId, 'already has live session',
          blocker._id.toString(), 'with user', String(blocker.user),
          '(status:', blocker.status, ', createdAt:', blocker.createdAt?.toISOString(), ')'
        );
      } else {
        // The unique index fired but no pending/active session exists for
        // this astrologer — that means the ACTUAL index in MongoDB doesn't
        // match the schema's partialFilterExpression (it's blocking on ANY
        // session ever created, not just live ones). This happens when the
        // index was built once and the schema changed later — Mongoose does
        // not auto-repair a mismatched index, you have to reconcile it.
        const mostRecent = await ChatSession.findOne({ astrologer: astrologerId }).sort({ createdAt: -1 });
        logError(
          'requestChat: DUPLICATE KEY FIRED BUT NO LIVE SESSION EXISTS. This means the MongoDB index on',
          'ChatSession.astrologer does not match the schema (missing/wrong partialFilterExpression) —',
          "it's blocking on ANY session ever created for this astrologer, not just pending/active ones.",
          'Most recent session for this astrologer:', mostRecent?._id?.toString(),
          '(status:', mostRecent?.status, ', endedAt:', mostRecent?.endedAt?.toISOString(), ').',
          'Fix: restart the server (it now runs ChatSession.syncIndexes() on boot), or run',
          'scripts/fix-chat-session-indexes.mjs directly.'
        );
      }

      throw new HttpError(409, 'This astrologer is currently in another chat', { astrologerBusy: true });
    }
    logError('requestChat: unexpected error creating session:', err);
    throw err;
  }

  getIO().to(personalRoom(astrologerId)).emit('chat:incoming', {
    session,
    user: publicUser(user),
  });

  return session;
}

/** Join / reconnect to a room's socket channel. Returns recent messages too. */
export async function joinSession({ sessionId, userId }) {
  const { session, role } = await assertParticipant(sessionId, userId);

  // Populate whichever side the caller doesn't already know about, so the
  // frontend gets a render-ready header (name, avatar, price, online status)
  // in the same round-trip instead of a second fetch.
  if (role === 'astrologer') {
    await session.populate('user', 'name');
  } else {
    await session.populate(
      'astrologer',
      'name astrologerProfile.profileImage astrologerProfile.isOnline astrologerProfile.isVerified astrologerProfile.chatCostPerSession astrologerProfile.sessionDurationMinutes'
    );
  }

  const messages = await ChatMessage.find({ session: sessionId }).sort({ createdAt: 1 }).limit(200);
  return { session, role, messages };
}

async function chargeForBlock(session) {
  const astrologerName = (await User.findById(session.astrologer).select('name')).name;
  const userDoc = await User.findById(session.user).select('name');

  if (session.isFree) {
    // No conditional guard here on purpose — matching {freeSessionUsed: false}
    // silently fails for any user document that predates this field (it's
    // missing entirely, not explicitly false, and Mongo equality queries
    // don't treat "missing" as "false" the way they do for null). Since
    // session.isFree was already decided once at request time, just set it.
    await User.updateOne({ _id: session.user }, { $set: { freeSessionUsed: true } });
    return { astrologerEarning: 0, platformCut: 0 };
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: session.user, walletBalance: { $gte: session.cost } },
    { $inc: { walletBalance: -session.cost } },
    { returnDocument: 'after' }
  );
  if (!updatedUser) {
    throw new HttpError(402, 'User has insufficient balance for this chat block', { insufficientBalance: true });
  }

  const platformCut = Math.round((session.cost * session.platformCutPercent) / 100);
  const astrologerEarning = session.cost - platformCut;

  // Credit walletBalance — the field actually returned by login/profile/admin
  // routes and shown in the app. earningsBalance is kept as a running
  // lifetime-earnings stat (useful for a future earnings dashboard) but
  // nothing currently exposes it, so crediting only that field left the
  // money invisible to the astrologer even though it was correctly recorded.
  const updatedAstrologer = await User.findByIdAndUpdate(
    session.astrologer,
    { $inc: { walletBalance: astrologerEarning, 'astrologerProfile.earningsBalance': astrologerEarning } },
    { returnDocument: 'after' }
  );

  await WalletTransaction.create({
    user: session.user,
    type: session.renewalCount > 0 ? 'chat_renewal' : 'chat_session',
    amount: -session.cost,
    balanceAfter: updatedUser.walletBalance,
    astrologer: session.astrologer,
    session: session._id,
    description: `Chat with ${astrologerName}`,
  });

  await WalletTransaction.create({
    user: session.astrologer,
    type: 'chat_earning',
    amount: astrologerEarning,
    balanceAfter: updatedAstrologer.walletBalance,
    astrologer: session.astrologer,
    session: session._id,
    description: `Chat earning from ${userDoc.name} (platform fee ${platformCut})`,
  });

  // Keep the older Transaction model (used by GET /billing/transactions) in sync too.
  await Transaction.create({ userId: session.user, amount: session.cost, type: 'spend', description: `Chat with ${astrologerName}` });
  await Transaction.create({ userId: session.astrologer, amount: astrologerEarning, type: 'credit', description: `Chat earning from ${userDoc.name}` });

  return { astrologerEarning, platformCut };
}

async function activateSession(session) {
  const { astrologerEarning } = await chargeForBlock(session);

  const now = new Date();
  session.status = 'active';
  session.activatedAt = now;
  session.expiresAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);
  session.totalCost += session.cost;
  session.totalAstrologerEarning += astrologerEarning;
  await session.save();

  getIO().to(sessionRoom(session._id)).emit('chat:activated', { session });
  return session;
}

/** Send a message. If this is the astrologer's first message on a pending session, activates it first. */
export async function sendMessage({ sessionId, senderId, text }) {
  const trimmed = (text || '').trim();
  if (!trimmed) throw new HttpError(400, 'Message text is required');

  const { session, role } = await assertParticipant(sessionId, senderId);

  if (session.status === 'ended') {
    throw new HttpError(409, 'This chat has ended');
  }

  if (session.status === 'pending') {
    if (role === 'astrologer') {
      await activateSession(session);
    }
  }

  const senderDoc = await User.findById(senderId).select('name');
  const message = await ChatMessage.create({
    session: sessionId,
    senderId,
    senderRole: role,
    senderName: senderDoc?.name || '',
    text: trimmed,
  });

  await ChatSession.updateOne(
    { _id: sessionId },
    { $set: { lastMessageAt: message.createdAt, lastMessagePreview: trimmed.slice(0, 120) } }
  );

  getIO().to(sessionRoom(sessionId)).emit('chat:message', { message });
  return message;
}

export async function setTyping({ sessionId, userId, isTyping }) {
  const { role } = await assertParticipant(sessionId, userId);
  getIO().to(sessionRoom(sessionId)).except(personalRoom(userId)).emit('chat:typing', {
    sessionId,
    role,
    isTyping: Boolean(isTyping),
  });
  return true;
}

/** User extends an active session (or reopens one that just expired) for another paid block. */
export async function renewSession({ sessionId, userId }) {
  const { session, role } = await assertParticipant(sessionId, userId);
  if (role !== 'user') throw new HttpError(403, 'Only the user can renew a session');

  const canRenew =
    session.status === 'active' ||
    (session.status === 'ended' && session.endedBy === 'expired' && Date.now() - new Date(session.endedAt).getTime() < 2 * 60 * 1000);

  if (!canRenew) {
    throw new HttpError(409, 'This session can no longer be renewed — start a new chat instead');
  }

  const astrologer = await User.findById(session.astrologer);
  session.cost = astrologer.astrologerProfile.chatCostPerSession || session.cost;
  session.durationMinutes = astrologer.astrologerProfile.sessionDurationMinutes || session.durationMinutes;
  session.isFree = false; // only the very first activation of a user's very first chat is ever free
  session.renewalCount += 1;

  if (session.status === 'ended') {
    // Re-open the same room. This can legitimately fail if someone else grabbed
    // the astrologer in the gap — the unique index protects us either way.
    try {
      const { astrologerEarning } = await chargeForBlock(session);
      const now = new Date();
      session.status = 'active';
      session.endedAt = null;
      session.endedBy = null;
      session.activatedAt = now;
      session.expiresAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);
      session.totalCost += session.cost;
      session.totalAstrologerEarning += astrologerEarning;
      await session.save();
    } catch (err) {
      if (err.code === 11000) {
        throw new HttpError(409, 'This astrologer is now busy with someone else', { astrologerBusy: true });
      }
      logError('renewSession: unexpected error reopening session', sessionId, err);
      throw err;
    }
  } else {
    const { astrologerEarning } = await chargeForBlock(session);
    session.expiresAt = new Date(session.expiresAt.getTime() + session.durationMinutes * 60 * 1000);
    session.totalCost += session.cost;
    session.totalAstrologerEarning += astrologerEarning;
    await session.save();
  }

  getIO().to(sessionRoom(sessionId)).emit('chat:renewed', { session });
  return session;
}

export async function creditConsultationIfActivated(session) {
  if (!session.activatedAt) return;
  try {
    await User.updateOne(
      { _id: session.astrologer },
      { $inc: { 'astrologerProfile.totalConsultations': 1 } }
    );
  } catch (err) {
    logError('creditConsultationIfActivated: failed for session', session._id.toString(), ':', err);
  }
}

/** Only the user can end a chat early — they paid for the block, astrologer just reflects it ending. */
export async function endSession({ sessionId, userId, reason = 'user' }) {
  const { session, role } = await assertParticipant(sessionId, userId);
  if (reason === 'user' && role !== 'user') {
    throw new HttpError(403, 'Only the user can end this chat');
  }
  if (session.status === 'ended') {
    return session;
  }

  session.status = 'ended';
  session.endedAt = new Date();
  session.endedBy = reason;

  try {
    await session.save();
  } catch (err) {
    // This is exactly the kind of failure that used to be silently swallowed
    // by the frontend and left the session stuck "active" forever — surface
    // it loudly here so it's never a mystery again.
    logError('endSession: FAILED TO SAVE session', sessionId, '— it is still live in the DB:', err);
    throw err;
  }

  await creditConsultationIfActivated(session);

  getIO().to(sessionRoom(sessionId)).emit('chat:ended', { sessionId, endedBy: reason });
  return session;
}

export async function rateSession({ sessionId, userId, rating, comment }) {
  const { session, role } = await assertParticipant(sessionId, userId);
  if (role !== 'user') throw new HttpError(403, 'Only the user can rate this chat');
  if (session.status !== 'ended') throw new HttpError(409, 'You can only rate a chat after it has ended');
  if (!session.activatedAt) {
    // activatedAt only ever gets set the moment the astrologer sends their
    // first message. If it's still null, the astrologer never actually
    // joined/responded — whether the session timed out, the user gave up
    // and left, or anything disconnected before that point, there's no
    // astrologer interaction to rate.
    throw new HttpError(409, 'The astrologer never joined this chat, so there is nothing to rate', { neverActivated: true });
  }
  if (session.rating != null) throw new HttpError(409, 'This session has already been rated');

  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw new HttpError(400, 'Rating must be an integer between 1 and 5');
  }

  session.rating = numericRating;
  session.ratingComment = (comment || '').trim();
  session.ratedAt = new Date();
  await session.save();

  // Best-effort running average on the astrologer's profile.
  const astrologer = await User.findById(session.astrologer).select('astrologerProfile.rating astrologerProfile.ratingCount astrologerProfile.totalReviews');
  const prevCount = astrologer.astrologerProfile.ratingCount || 0;
  const prevAvg = astrologer.astrologerProfile.rating || 0;
  const newCount = prevCount + 1;
  const newAvg = (prevAvg * prevCount + numericRating) / newCount;

  await User.updateOne(
    { _id: session.astrologer },
    {
      $set: { 'astrologerProfile.rating': Number(newAvg.toFixed(2)), 'astrologerProfile.ratingCount': newCount },
      $inc: { 'astrologerProfile.totalReviews': 1 },
    }
  );

  return session;
}

/** Generates a one-time shareable invite code so the user can pull exactly one extra guest in. */
export async function createInvite({ sessionId, userId }) {
  const { session, role } = await assertParticipant(sessionId, userId);
  if (role !== 'user') throw new HttpError(403, 'Only the user can invite a guest');
  if (session.status === 'ended') throw new HttpError(409, 'This chat has already ended');
  if (session.guest?.user) throw new HttpError(409, 'A guest has already joined this chat');

  let code;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = crypto.randomBytes(4).toString('hex');
    const clash = await ChatSession.exists({ inviteCode: code });
    if (!clash) break;
    code = null;
  }
  if (!code) throw new HttpError(500, 'Could not generate a unique invite code, try again');

  session.inviteCode = code;
  session.inviteCodeExpiresAt = session.expiresAt || new Date(Date.now() + 10 * 60 * 1000);
  await session.save();

  return { code, expiresAt: session.inviteCodeExpiresAt };
}

export async function joinInvite({ code, guestUserId }) {
  const session = await ChatSession.findOne({ inviteCode: code });
  if (!session) throw new HttpError(404, 'Invalid or expired invite link');
  if (session.inviteCodeExpiresAt && session.inviteCodeExpiresAt < new Date()) {
    throw new HttpError(410, 'This invite link has expired');
  }
  if (!['pending', 'active'].includes(session.status)) throw new HttpError(409, 'This chat has already ended');
  if (session.guest?.user) throw new HttpError(409, 'This chat already has a guest');
  if ([String(session.user), String(session.astrologer)].includes(String(guestUserId))) {
    throw new HttpError(400, 'You are already part of this chat');
  }

  session.guest = { user: guestUserId, joinedAt: new Date() };
  await session.save();

  // Genuinely unset the field (not just set it to null) — a null value would
  // still be "present" as far as the sparse unique index is concerned, and
  // could collide with the next session that also has no invite code.
  await ChatSession.updateOne({ _id: session._id }, { $unset: { inviteCode: 1, inviteCodeExpiresAt: 1 } });
  session.inviteCode = undefined;
  session.inviteCodeExpiresAt = undefined;

  const guest = await User.findById(guestUserId).select('name');
  getIO().to(sessionRoom(session._id)).emit('chat:guest-joined', { sessionId: session._id, guest: publicUser(guest) });

  await session.populate('astrologer', 'name astrologerProfile.profileImage astrologerProfile.isOnline');
  const messages = await ChatMessage.find({ session: session._id }).sort({ createdAt: 1 }).limit(200);
  return { session, messages };
}

/**
 * Ends one stale session and reports success/failure — pulled out of the sweep
 * loop so that ONE bad document (a validation error, corrupted data, whatever)
 * can never abort the whole batch. Before this, a single failing `.save()`
 * threw past the `for` loop straight into the outer try/catch, which silently
 * skipped every other session in that tick AND every tick after, for as long
 * as that one bad document existed — which is exactly the kind of bug that
 * looks like "the timeout just doesn't work" from the outside.
 */
async function forceEndOne(session, reason) {
  try {
    session.status = 'ended';
    session.endedAt = new Date();
    session.endedBy = 'expired';
    await session.save();

    await creditConsultationIfActivated(session);

    getIO().to(sessionRoom(session._id)).emit('chat:ended', {
      sessionId: session._id,
      endedBy: 'expired',
      reason,
    });
    return true;
  } catch (err) {
    logError('sweep: FAILED to end session', session._id.toString(), '— it will be retried next tick. Error:', err);
    return false;
  }
}

/**
 * Periodic sweep — replaces per-session timers with one cheap query pair every
 * few seconds. Handles: astrologer never replying (pending timeout) and active
 * sessions that simply ran out of time.
 */
export function startExpirySweep({ intervalMs = 15000 } = {}) {
  const timer = setInterval(async () => {
    try {
      const now = new Date();

      const expiredActive = await ChatSession.find({ status: 'active', expiresAt: { $lte: now } });
      for (const session of expiredActive) {
        await forceEndOne(session, 'active session ran out of time');
      }

      const staleNessCutoff = new Date(now.getTime() - PENDING_TIMEOUT_MS);
      const stalePending = await ChatSession.find({ status: 'pending', createdAt: { $lte: staleNessCutoff } });
      for (const session of stalePending) {
        await forceEndOne(session, 'Astrologer did not respond in time');
      }
    } catch (err) {
      // With per-session handling above, this should now only ever catch
      // errors in the find() queries themselves — never a single doc's save
      // taking down the whole tick.
      logError('expiry sweep tick failed:', err);
    }
  }, intervalMs);

  return () => clearInterval(timer);
}