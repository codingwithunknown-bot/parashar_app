import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['spend', 'credit'], required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
},{ timestamps: true });

export default mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

