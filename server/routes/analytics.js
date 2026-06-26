const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');

// GET /api/analytics/monthly  — aggregate income/expense per month for current year
router.get('/monthly', protect, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const data = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31T23:59:59`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Transform into per-month format
    const months = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      income: 0,
      expense: 0,
    }));

    data.forEach(({ _id, total }) => {
      const m = months[_id.month - 1];
      if (_id.type === 'income') m.income = total;
      else m.expense = total;
    });

    res.json(months);
  } catch (err) {
    console.error('Monthly analytics error:', err);
    res.status(500).json({ message: 'Server error fetching monthly analytics' });
  }
});

// GET /api/analytics/categories  — aggregate expenses by category for a given period
router.get('/categories', protect, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const matchQuery = { userId: req.user._id, type: 'expense' };

    if (startDate || endDate) {
      matchQuery.date = {};
      if (startDate) matchQuery.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchQuery.date.$lte = end;
      }
    } else {
      // Default: current month
      const now = new Date();
      matchQuery.date = {
        $gte: new Date(now.getFullYear(), now.getMonth(), 1),
        $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      };
    }

    const data = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    const totalExpense = data.reduce((sum, d) => sum + d.total, 0);
    const result = data.map((d) => ({
      category: d._id,
      total: d.total,
      count: d.count,
      percentage: totalExpense > 0 ? Math.round((d.total / totalExpense) * 100) : 0,
    }));

    res.json({ categories: result, totalExpense });
  } catch (err) {
    console.error('Category analytics error:', err);
    res.status(500).json({ message: 'Server error fetching category analytics' });
  }
});

// GET /api/analytics/daily  — daily spending trend for last 30 days
router.get('/daily', protect, async (req, res) => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    const data = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.date': 1 } },
    ]);

    // Build full 30-day array
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('default', { month: 'short', day: 'numeric' }),
        income: 0,
        expense: 0,
      });
    }

    data.forEach(({ _id, total }) => {
      const day = days.find((d) => d.date === _id.date);
      if (day) {
        if (_id.type === 'income') day.income = total;
        else day.expense = total;
      }
    });

    res.json(days);
  } catch (err) {
    console.error('Daily analytics error:', err);
    res.status(500).json({ message: 'Server error fetching daily analytics' });
  }
});

// GET /api/analytics/summary  — quick summary stats for dashboard
router.get('/summary', protect, async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [monthlyData] = await Transaction.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: monthStart, $lte: monthEnd },
        },
      },
      {
        $group: {
          _id: null,
          monthlyIncome: {
            $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
          },
          monthlyExpense: {
            $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
          },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    res.json({
      monthlyIncome: monthlyData?.monthlyIncome || 0,
      monthlyExpense: monthlyData?.monthlyExpense || 0,
      monthlyTransactions: monthlyData?.transactionCount || 0,
      monthlySavings: (monthlyData?.monthlyIncome || 0) - (monthlyData?.monthlyExpense || 0),
    });
  } catch (err) {
    console.error('Summary analytics error:', err);
    res.status(500).json({ message: 'Server error fetching summary' });
  }
});

module.exports = router;
