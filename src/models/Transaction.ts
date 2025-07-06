import mongoose from 'mongoose';
import { transactionCategories } from '@/types';

// Define the Transaction schema
const transactionSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    validate: {
      validator: function(value: number) {
        return value >= -999999999999.99 && value <= 999999999999.99;
      },
      message: 'Amount must be between -999,999,999,999.99 and 999,999,999,999.99'
    }
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