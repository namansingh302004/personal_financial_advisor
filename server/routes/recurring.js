const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const RecurringPayment = require('../models/RecurringPayment');

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
    const { title, amount, type, category, frequency, nextDueDate } = req.body;
    if (!title || !amount || !nextDueDate) {
      return res.status(400).json({ message: 'Title, amount and next due date are required' });
    }

    const payment = await RecurringPayment.create({
      userId: req.user._id,
      title,
      amount: Number(amount),
      type: type || 'expense',
      category: category || 'Bills & Utilities',
      frequency: frequency || 'monthly',
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

    const { title, amount, type, category, frequency, nextDueDate, active } = req.body;
    if (title !== undefined) payment.title = title;
    if (amount !== undefined) payment.amount = Number(amount);
    if (type !== undefined) payment.type = type;
    if (category !== undefined) payment.category = category;
    if (frequency !== undefined) payment.frequency = frequency;
    if (nextDueDate !== undefined) payment.nextDueDate = new Date(nextDueDate);
    if (active !== undefined) payment.active = active;

    await payment.save();
    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: 'Server error updating recurring payment' });
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
