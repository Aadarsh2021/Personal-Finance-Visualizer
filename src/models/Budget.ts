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
    max: [999999999999.99, 'Amount cannot exceed ₹999,999,999,999.99'],
    validate: {
      validator: function(v: number) {
        // Check if it's a valid number with at most 2 decimal places
        return Number.isFinite(v) && 
               v >= 0 && 
               v <= 999999999999.99 && 
               /^\d+(\.\d{0,2})?$/.test(v.toString());
      },
      message: 'Invalid amount format. Must be a positive number with at most 2 decimal places'
    },
    set: function(v: number) {
      // Round to 2 decimal places
      return Number(v.toFixed(2));
    }
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
    max: [2100, 'Year must be 2100 or earlier'],
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
  toJSON: {
    transform: function(doc, ret) {
      // Ensure amount is always formatted with 2 decimal places
      ret.amount = Number(ret.amount.toFixed(2));
      return ret;
    }
  }
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

// Add method to get budget status
budgetSchema.methods.getStatus = function() {
  const spent = this.spent || 0;
  const remaining = Math.max(0, this.amount - spent);
  const percentUsed = (spent / this.amount) * 100;

  return {
    budget: this.amount,
    spent,
    remaining,
    percentUsed: Number(percentUsed.toFixed(1)),
    status: percentUsed >= 100 ? 'over' : percentUsed >= 80 ? 'warning' : 'onTrack'
  };
};

export const Budget = mongoose.models.Budget || mongoose.model('Budget', budgetSchema);

export default Budget; 