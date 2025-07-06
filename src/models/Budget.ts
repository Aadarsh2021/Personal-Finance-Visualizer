import mongoose from 'mongoose';
import { transactionCategories } from '@/types';

// Define the Budget schema
const budgetSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: transactionCategories,
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive'],
  },
  month: {
    type: Number,
    required: true,
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v);
      },
      message: 'Month must be a whole number'
    }
  },
  year: {
    type: Number,
    required: true,
    min: [2000, 'Year must be 2000 or later'],
    validate: {
      validator: function(v: number) {
        return Number.isInteger(v);
      },
      message: 'Year must be a whole number'
    }
  },
  completed: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Create compound index for unique monthly category budgets
budgetSchema.index({ category: 1, month: 1, year: 1 }, { unique: true });

// Add error handling for duplicate key errors
budgetSchema.post('save', function(error: any, doc: any, next: any) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('A budget for this category already exists for the selected month and year'));
  } else {
    next(error);
  }
});

export const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget; 