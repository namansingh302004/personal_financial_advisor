const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// GET /api/moments/today
router.get('/today', protect, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ date: -1 });

    const totalSpent = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEarned = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(categoryBreakdown).sort(([, a], [, b]) => b - a)[0];
    const biggestExpense = transactions
      .filter((t) => t.type === 'expense')
      .sort((a, b) => b.amount - a.amount)[0];

    // Get month-to-date budget info
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = await Transaction.find({
      userId: req.user._id,
      type: 'expense',
      date: { $gte: startOfMonth, $lt: endOfDay },
    });
    const monthSpent = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

    res.json({
      date: startOfDay.toISOString(),
      transactionCount: transactions.length,
      totalSpent,
      totalEarned,
      categoryBreakdown,
      topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
      biggestExpense: biggestExpense
        ? { note: biggestExpense.note || biggestExpense.category, amount: biggestExpense.amount }
        : null,
      monthBudget: req.user.monthlyBudget || 0,
      monthSpent,
      userName: req.user.name,
    });
  } catch (err) {
    console.error('Moments today error:', err);
    res.status(500).json({ message: 'Failed to load today\'s moment' });
  }
});

// GET /api/moments/week
router.get('/week', protect, async (req, res) => {
  try {
    const now = new Date();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const transactions = await Transaction.find({
        userId: req.user._id,
        date: { $gte: startOfDay, $lt: endOfDay },
      });

      const totalSpent = transactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const topCategory = {};
      transactions
        .filter((t) => t.type === 'expense')
        .forEach((t) => {
          topCategory[t.category] = (topCategory[t.category] || 0) + t.amount;
        });

      const top = Object.entries(topCategory).sort(([, a], [, b]) => b - a)[0];

      days.push({
        date: startOfDay.toISOString(),
        totalSpent,
        transactionCount: transactions.length,
        topCategory: top ? top[0] : null,
      });
    }

    res.json(days);
  } catch (err) {
    console.error('Moments week error:', err);
    res.status(500).json({ message: 'Failed to load week moments' });
  }
});

// POST /api/moments/caption
router.post('/caption', protect, async (req, res) => {
  try {
    const { totalSpent, topCategory, biggestExpense, transactionCount, monthBudget, monthSpent } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const prompt = `Generate a fun, witty, short one-liner caption (max 15 words) for a daily spending summary card. Be playful but not mean. Use emojis.

Today's stats:
- Total spent: ₹${totalSpent || 0}
- Number of transactions: ${transactionCount || 0}
- Top spending category: ${topCategory || 'nothing'}
- Biggest expense: ${biggestExpense || 'nothing'}
- Monthly budget: ₹${monthBudget || 0}
- Month-to-date spent: ₹${monthSpent || 0}

${totalSpent === 0 ? 'The user spent NOTHING today — celebrate that!' : ''}
${monthBudget > 0 && monthSpent > monthBudget ? 'The user is OVER budget this month — be gentle but honest.' : ''}

Return ONLY the caption text, nothing else.`;

    const result = await model.generateContent(prompt);
    const caption = result.response.text().trim();

    res.json({ caption });
  } catch (err) {
    console.error('Moments caption error:', err);
    res.json({ caption: '✨ Another day, another dollar tracked!' });
  }
});

module.exports = router;
