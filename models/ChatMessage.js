import mongoose from 'mongoose';

// Chat text isn't kept long-term by product decision — messages just need to be
// live/reloadable for the duration of a session (and a little after, in case of
// a reconnect). A TTL index handles cleanup automatically, no cron job needed.
const MESSAGE_TTL_SECONDS = 60 * 60 * 24; // 24h

const ChatMessageSchema = new mongoose.Schema({
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['user', 'astrologer', 'guest'], required: true },
  senderName: { type: String, default: '' },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
});

ChatMessageSchema.index({ createdAt: 1 }, { expireAfterSeconds: MESSAGE_TTL_SECONDS });

export default mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema);
