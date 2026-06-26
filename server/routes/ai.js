const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/ai/insights
router.post('/insights', protect, async (req, res) => {
  try {
    const { timeframe = 'month' } = req.body;

    // Determine date range based on timeframe
    const now = new Date();
    let startDate;
    switch (timeframe) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case '3months':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const transactions = await Transaction.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now },
    }).sort({ date: -1 });

    if (transactions.length === 0) {
      return res.json({
        insights: 'No transactions found for the selected period. Start adding transactions to get AI-powered financial insights.',
      });
    }

    // Aggregate summary stats
    const totalIncome = transactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);

    const categoryBreakdown = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

    const topCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(0)}`)
      .join(', ');

    const recentTransactions = transactions.slice(0, 15).map((t) =>
      `${t.type === 'income' ? '+' : '-'}₹${t.amount} [${t.category}] ${t.note || ''}`
    ).join('\n');

    const prompt = `You are a friendly, expert personal finance advisor. Analyze the following financial data and provide 3-4 clear, actionable, and encouraging insights. Keep the tone warm and professional. Format the response as clean paragraphs without markdown headers or bullet points — just natural, readable text.

User: ${req.user.name}
Timeframe: ${timeframe === 'month' ? 'This Month' : timeframe === 'week' ? 'This Week' : timeframe === '3months' ? 'Last 3 Months' : 'This Year'}

Financial Summary:
- Total Income: ₹${totalIncome.toFixed(0)}
- Total Expenses: ₹${totalExpense.toFixed(0)}
- Net Savings: ₹${(totalIncome - totalExpense).toFixed(0)}
- Savings Rate: ${totalIncome > 0 ? ((( totalIncome - totalExpense) / totalIncome) * 100).toFixed(1) : 0}%
- Number of transactions: ${transactions.length}

Top Spending Categories: ${topCategories || 'N/A'}

Recent Transactions:
${recentTransactions}

Provide personalized financial insights, highlight any spending patterns, suggest areas to improve, and give one actionable recommendation for the next month.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const insights = result.response.text();

    res.json({ insights, transactionCount: transactions.length, totalIncome, totalExpense });
  } catch (err) {
    console.error('AI insights error:', err);
    if (err.message?.includes('API_KEY') || err.message?.includes('apiKey')) {
      return res.status(500).json({ message: 'Gemini API key not configured. Please set GEMINI_API_KEY in the server environment.' });
    }
    res.status(500).json({ message: 'Error generating AI insights. Please try again.' });
  }
});

module.exports = router;
