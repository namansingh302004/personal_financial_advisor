const mongoose = require('mongoose');

const recurringPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be positive'],
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      default: 'expense',
    },
    category: {
      type: String,
      default: 'Bills & Utilities',
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      default: 'monthly',
    },
    nextDueDate: {
      type: Date,
      required: [true, 'Next due date is required'],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecurringPayment', recurringPaymentSchema);
