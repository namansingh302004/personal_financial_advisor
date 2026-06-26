const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');

// GET /api/debts
router.get('/', protect, async (req, res) => {
  try {
    const debts = await Debt.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(debts);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching debts' });
  }
});

// POST /api/debts
router.post('/', protect, async (req, res) => {
  try {
    const { personName, amount, type, dueDate, note } = req.body;
    
    if (!personName || !amount || !type) {
      return res.status(400).json({ message: 'Person name, amount, and type are required' });
    }

    const debt = await Debt.create({
      userId: req.user._id,
      personName,
      amount: Number(amount),
      type,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      note,
    });

    res.status(201).json(debt);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating debt' });
  }
});

// PUT /api/debts/:id/settle
router.put('/:id/settle', protect, async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });

    debt.status = 'settled';
    await debt.save();

    // Optionally create a transaction for the settlement
    // If I lent money (lent) and it's settled, I got my money back -> Income
    // If I borrowed money (borrowed) and it's settled, I paid it back -> Expense
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: debt.amount,
      type: debt.type === 'lent' ? 'income' : 'expense',
      category: 'Other', // Or maybe 'Debt Settlement'
      note: `Settled debt with ${debt.personName}`,
      date: new Date(),
    });

    res.json({ debt, transaction });
  } catch (err) {
    res.status(500).json({ message: 'Server error settling debt' });
  }
});

// DELETE /api/debts/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const debt = await Debt.findOne({ _id: req.params.id, userId: req.user._id });
    if (!debt) return res.status(404).json({ message: 'Debt not found' });
    
    await debt.deleteOne();
    res.json({ message: 'Debt deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting debt' });
  }
});

module.exports = router;
