import mongoose from 'mongoose';
import { transactionCategories } from '@/types';

// Define the Transaction schema
const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: transactionCategories,
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true,
  },
}, {
  timestamps: true,
});

// Create indexes for better query performance
transactionSchema.index({ date: -1 });
transactionSchema.index({ category: 1 });

export const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

export default Transaction; 