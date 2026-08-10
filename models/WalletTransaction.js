import mongoose from 'mongoose';

const WalletTransactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

        type: {
            type: String,
            enum: ['chat_session', 'chat_renewal', 'topup', 'refund', 'adjustment', 'chat_earning', 'referral_bonus'],
            required: true,
        },

        amount: { type: Number, required: true },
        balanceAfter: { type: Number, required: true },

        astrologer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        session: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession', default: null },

        description: { type: String, default: '' },
    },
    { timestamps: true }
);

WalletTransactionSchema.index({ user: 1, createdAt: -1 });

export default mongoose.models.WalletTransaction || mongoose.model('WalletTransaction', WalletTransactionSchema);
