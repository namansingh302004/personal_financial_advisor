const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    timeframe: {
      type: String,
      required: true,
      enum: ['week', 'month', '3months', 'year'],
    },
    content: {
      type: String,
      required: true,
    },
    totalIncome: { type: Number },
    totalExpense: { type: Number },
    transactionCount: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Insight', insightSchema);
