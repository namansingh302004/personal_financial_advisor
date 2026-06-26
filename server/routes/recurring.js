const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const RecurringPayment = require('../models/RecurringPayment');
const Transaction = require('../models/Transaction');

// GET /api/recurring
router.get('/', protect, async (req, res) => {
  try {
    const payments = await RecurringPayment.find({ userId: req.user._id }).sort({ nextDueDate: 1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: 'Server error fetching recurring payments' });
  }
});

// POST /api/recurring
router.post('/', protect, async (req, res) => {
  try {
    const { title, amount, type, category, intervalValue, intervalUnit, nextDueDate } = req.body;
    if (!title || !amount || !nextDueDate) {
      return res.status(400).json({ message: 'Title, amount and next due date are required' });
    }

    const payment = await RecurringPayment.create({
      userId: req.user._id,
      title,
      amount: Number(amount),
      type: type || 'expense',
      category: category || 'Bills & Utilities',
      intervalValue: intervalValue ? Number(intervalValue) : 1,
      intervalUnit: intervalUnit || 'months',
      nextDueDate: new Date(nextDueDate),
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error creating recurring payment' });
  }
});

// PUT /api/recurring/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const payment = await RecurringPayment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!payment) return res.status(404).json({ message: 'Recurring payment not found' });

    const { title, amount, type, category, intervalValue, intervalUnit, nextDueDate, active } = req.body;
    if (title !== undefined) payment.title = title;
    if (amount !== undefined) payment.amount = Number(amount);
    if (type !== undefined) payment.type = type;
    if (category !== undefined) payment.category = category;
    if (intervalValue !== undefined) payment.intervalValue = Number(intervalValue);
    if (intervalUnit !== undefined) payment.intervalUnit = intervalUnit;
    if (nextDueDate !== undefined) payment.nextDueDate = new Date(nextDueDate);
    if (active !== undefined) payment.active = active;

    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating recurring payment' });
  }
});

// POST /api/recurring/:id/pay
router.post('/:id/pay', protect, async (req, res) => {
  try {
    const payment = await RecurringPayment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!payment) return res.status(404).json({ message: 'Recurring payment not found' });

    // 1. Create the transaction
    const transaction = await Transaction.create({
      userId: req.user._id,
      amount: payment.amount,
      type: payment.type,
      category: payment.category,
      note: payment.title + ' (Recurring)',
      recurring: true,
      date: new Date(),
    });

    // 2. Update the nextDueDate
    const currentDueDate = new Date(payment.nextDueDate);
    const value = payment.intervalValue || 1;
    switch (payment.intervalUnit) {
      case 'days':
        currentDueDate.setDate(currentDueDate.getDate() + value);
        break;
      case 'weeks':
        currentDueDate.setDate(currentDueDate.getDate() + value * 7);
        break;
      case 'months':
        currentDueDate.setMonth(currentDueDate.getMonth() + value);
        break;
      case 'years':
        currentDueDate.setFullYear(currentDueDate.getFullYear() + value);
        break;
      default:
        currentDueDate.setMonth(currentDueDate.getMonth() + value);
    }
    
    payment.nextDueDate = currentDueDate;
    await payment.save();

    res.status(201).json({ transaction, payment });
  } catch (err) {
    res.status(500).json({ message: 'Server error recording payment' });
  }
});

// DELETE /api/recurring/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const payment = await RecurringPayment.findOne({ _id: req.params.id, userId: req.user._id });
    if (!payment) return res.status(404).json({ message: 'Recurring payment not found' });
    await payment.deleteOne();
    res.json({ message: 'Recurring payment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error deleting recurring payment' });
  }
});

module.exports = router;
