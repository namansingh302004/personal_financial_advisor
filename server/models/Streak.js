const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['no_spend', 'daily_log', 'under_budget'],
      required: true,
    },
    currentCount: {
      type: Number,
      default: 0,
    },
    longestCount: {
      type: Number,
      default: 0,
    },
    lastActiveDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

streakSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Streak', streakSchema);
