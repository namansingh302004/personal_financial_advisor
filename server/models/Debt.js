const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    personName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      required: true,
      enum: ['borrowed', 'lent'],
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'settled'],
      default: 'pending',
    },
    dueDate: {
      type: Date,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Debt', debtSchema);
