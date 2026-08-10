import mongoose from 'mongoose';

const ChatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // pending  -> room created, astrologer hasn't sent a message yet (no timer, no charge yet)
    // active   -> astrologer sent their first message, timer + charge kicked in
    // ended    -> closed (see endedBy for why)
    status: {
      type: String,
      enum: ['pending', 'active', 'ended'],
      default: 'pending',
      index: true,
    },

    isFree: { type: Boolean, default: false },
    cost: { type: Number, default: 0 }, // cost of the current/most recent block
    durationMinutes: { type: Number, required: true },
    platformCutPercent: { type: Number, default: 20 },

    totalCost: { type: Number, default: 0 }, // sum charged to the user across activation + renewals
    totalAstrologerEarning: { type: Number, default: 0 }, // sum credited to astrologer (after platform cut)
    renewalCount: { type: Number, default: 0 },

    activatedAt: { type: Date, default: null }, // set the moment the astrologer's first message lands
    expiresAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    endedBy: {
      type: String,
      enum: ['user', 'astrologer', 'expired', null],
      default: null,
    },

    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: '' },

    rating: { type: Number, min: 1, max: 5, default: null },
    ratingComment: { type: String, default: '', trim: true },
    ratedAt: { type: Date, default: null },

    // Shareable invite link/code — lets the user pull exactly one extra guest into the room.
    // No `default: null` here on purpose — MongoDB's sparse index only
    // excludes documents where the field is entirely ABSENT, not documents
    // where it's explicitly set to null. `default: null` would write
    // inviteCode: null onto every session, and since that's a unique sparse
    // index, only one document in the whole collection could ever have that
    // value — which is exactly the bug that caused every session after the
    // first to collide with E11000 on { inviteCode: null }.
    inviteCode: { type: String },
    inviteCodeExpiresAt: { type: Date },
    guest: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      joinedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

// THE key constraint: an astrologer can have at most one pending/active session
// at any moment. This is what makes them show "Busy" to every other user the
// instant a chat is requested, and it's race-safe even if two users tap Chat
// on the same astrologer at the exact same millisecond — Mongo just rejects
// the second insert with a duplicate-key error.
ChatSessionSchema.index(
  { astrologer: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'active'] } } }
);

ChatSessionSchema.index({ user: 1, status: 1 });
ChatSessionSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });
ChatSessionSchema.index({ status: 1, expiresAt: 1 }); // for the expiry sweep
ChatSessionSchema.index({ status: 1, createdAt: 1 }); // for the pending-timeout sweep

export default mongoose.models.ChatSession || mongoose.model('ChatSession', ChatSessionSchema);