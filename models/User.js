import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },

        password: {
            type: String,
            required: function () {
                return this.authProvider === 'local';
            },
        },

        authProvider: {
            type: String,
            enum: ['local', 'google', 'apple'],
            default: 'local',
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        appleId: {
            type: String,
            unique: true,
            sparse: true,
        },

        role: {
            type: String,
            enum: ['user', 'astrologer', 'admin'],
            default: 'user',
        },
        resetOtp: {
            type: String,
            default: null,
        },
        resetOtpExpires: {
            type: Date,
            default: null,
        },

        walletBalance: { type: Number, default: 0 },
        isPremium: { type: Boolean, default: false },
        unlockedFeatures: [{ type: String }],

        // --- Referral program ---
        // Every user gets a permanent 6-digit code they can share. New sign-ups
        // who enter someone's code link to them via `referredBy` (once, forever).
        // Both sides are then credited REFERRAL_BONUS_TOKENS into `referralBalance`
        // — a wallet that's spendable on in-app features (unlockFeature / faladesh)
        // but deliberately kept separate from `walletBalance` so it can NEVER be
        // used to pay for astrologer chat (see services/chatService.js, which only
        // ever reads/writes `walletBalance`).
        referralCode: { type: String, unique: true, sparse: true },
        referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        referralBalance: { type: Number, default: 0 },
        referralCount: { type: Number, default: 0 },

        // Platform-wide: a user's very first astrologer chat session is free,
        // every session after that (with any astrologer) is paid.
        freeSessionUsed: { type: Boolean, default: false },

        astrologerProfile: {
            specialization: [{ type: String }],
            languages: [{ type: String }],
            experienceYears: { type: Number, default: 0 },
            about: { type: String, trim: true, default: '' },
            profileImage: { type: String, default: '' },
            pricePerMinute: { type: Number, default: 0 },
            rating: { type: Number, default: 0 },
            ratingCount: { type: Number, default: 0 },
            totalReviews: { type: Number, default: 0 },
            totalConsultations: { type: Number, default: 0 },
            earningsBalance: { type: Number, default: 0 },
            isOnline: { type: Boolean, default: false },
            lastActiveAt: { type: Date, default: null },
            isVerified: { type: Boolean, default: false },
            isFeatured: { type: Boolean, default: false },
            certifications: [{ type: String }],
            probationEndsAt: { type: Date, default: null },

            chatCostPerSession: { type: Number, default: 50 },
            sessionDurationMinutes: { type: Number, default: 5 },

            // How many times any user has tapped "Chat" on this astrologer, ever
            // (regardless of whether the tap succeeded or hit "astrologer busy").
            // Purely an analytics counter for the astrologer's own dashboard.
            totalChatRequests: { type: Number, default: 0 },
        },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);

