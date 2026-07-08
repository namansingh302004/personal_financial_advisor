const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    challengeId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['no_spend_day', 'budget_week', 'category_cap', 'savings_target', 'transaction_streak', 'custom'],
      required: true,
    },
    icon: {
      type: String,
      default: '🎯',
    },
    target: {
      type: Number,
      required: true,
    },
    progress: {
      type: Number,
      default: 0,
    },
    unit: {
      type: String,
      default: 'days',
    },
    category: {
      type: String,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'failed'],
      default: 'active',
    },
    badge: {
      name: { type: String },
      icon: { type: String },
      color: { type: String },
    },
  },
  { timestamps: true }
);

challengeSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Challenge', challengeSchema);
