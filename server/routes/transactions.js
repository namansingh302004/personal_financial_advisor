const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

// GET /api/transactions  — with optional filters: ?type=&category=&startDate=&endDate=&search=
router.get('/', protect, async (req, res) => {
  try {
    const { type, category, startDate, endDate, search } = req.query;
    const query = { userId: req.user._id };

    if (type && ['income', 'expense'].includes(type)) query.type = type;
    if (category) query.category = category;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }
    if (search) {
      query.$or = [
        { note: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const transactions = await Transaction.find(query).sort({ date: -1 }).limit(200);
    res.json(transactions);
  } catch (err) {
    console.error('Get transactions error:', err);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// POST /api/transactions
router.post('/', protect, async (req, res) => {
  try {
    const { amount, type, category, note, paymentMethod, recurring, date } = req.body;

    if (!amount || !type) {
      return res.status(400).json({ message: 'Amount and type are required' });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: Number(amount),
      type,
      category: category || 'Other',
      note: note || '',
      paymentMethod: paymentMethod || 'other',
      recurring: recurring || false,
      date: date ? new Date(date) : new Date(),
    });

    // Update wallet balance
    const delta = type === 'income' ? Number(amount) : -Number(amount);
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: delta },
    });

    res.status(201).json(transaction);
  } catch (err) {
    console.error('Create transaction error:', err);
    res.status(500).json({ message: 'Server error creating transaction' });
  }
});

// DELETE /api/transactions/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Reverse the balance delta
    const delta = transaction.type === 'income' ? -transaction.amount : transaction.amount;
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { walletBalance: delta },
    });

    await transaction.deleteOne();
    res.json({ message: 'Transaction deleted' });
  } catch (err) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ message: 'Server error deleting transaction' });
  }
});

module.exports = router;
