const mongoose = require('mongoose');

const CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Entertainment',
  'Health & Fitness',
  'Shopping',
  'Bills & Utilities',
  'Education',
  'Travel',
  'Groceries',
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Other',
];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Type is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      default: 'Other',
    },
    note: {
      type: String,
      trim: true,
      maxlength: [200, 'Note cannot exceed 200 characters'],
      default: '',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'netbanking', 'other'],
      default: 'other',
    },
    recurring: {
      type: Boolean,
      default: false,
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for efficient user+date queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
