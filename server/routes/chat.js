const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const RecurringPayment = require('../models/RecurringPayment');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// POST /api/chat
router.post('/', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Gather user's financial context
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [allTransactions, recurringPayments] = await Promise.all([
      Transaction.find({
        userId: req.user._id,
        date: { $gte: startOfYear },
      }).sort({ date: -1 }),
      RecurringPayment.find({ userId: req.user._id }),
    ]);

    // This month stats
    const thisMonthTx = allTransactions.filter((t) => t.date >= startOfMonth);
    const thisMonthIncome = thisMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const thisMonthExpense = thisMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Last month stats
    const lastMonthTx = allTransactions.filter((t) => t.date >= startOfLastMonth && t.date < startOfMonth);
    const lastMonthIncome = lastMonthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const lastMonthExpense = lastMonthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    // Category breakdown this month
    const categoryBreakdown = {};
    thisMonthTx
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
      });

    const categoryStr = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(0)}`)
      .join(', ');

    // Recent transactions (last 20)
    const recentTxStr = allTransactions
      .slice(0, 20)
      .map((t) => {
        const date = new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return `${date} | ${t.type === 'income' ? '+' : '-'}₹${t.amount} | ${t.category} | ${t.note || 'no note'}`;
      })
      .join('\n');

    // Recurring payments summary
    const recurringStr = recurringPayments
      .map((p) => `${p.title}: ₹${p.amount}/${p.intervalUnit} (${p.active ? 'active' : 'paused'})`)
      .join(', ');

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const mTx = allTransactions.filter((t) => t.date >= m && t.date < mEnd);
      const mIncome = mTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const mExpense = mTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const monthName = m.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      monthlyTrend.push(`${monthName}: Income ₹${mIncome.toFixed(0)}, Expense ₹${mExpense.toFixed(0)}`);
    }

    const systemPrompt = `You are Finwise AI — a friendly, knowledgeable personal finance assistant. You have access to the user's complete financial data below. Answer their questions accurately using this data. Be conversational, helpful, and occasionally witty. Use ₹ for currency.

USER PROFILE:
- Name: ${req.user.name}
- Wallet Balance: ₹${req.user.walletBalance || 0}
- Monthly Budget: ₹${req.user.monthlyBudget || 0}

THIS MONTH (${now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}):
- Income: ₹${thisMonthIncome.toFixed(0)}
- Expenses: ₹${thisMonthExpense.toFixed(0)}
- Net: ₹${(thisMonthIncome - thisMonthExpense).toFixed(0)}
- Budget Used: ${req.user.monthlyBudget > 0 ? ((thisMonthExpense / req.user.monthlyBudget) * 100).toFixed(1) + '%' : 'No budget set'}
- Category Breakdown: ${categoryStr || 'No expenses yet'}
- Transaction Count: ${thisMonthTx.length}

LAST MONTH:
- Income: ₹${lastMonthIncome.toFixed(0)}
- Expenses: ₹${lastMonthExpense.toFixed(0)}

MONTHLY TREND (last 6 months):
${monthlyTrend.join('\n')}

RECURRING PAYMENTS:
${recurringStr || 'None'}

RECENT TRANSACTIONS (last 20):
${recentTxStr || 'No transactions'}

RULES:
- Only answer questions related to personal finance, budgeting, or the user's financial data.
- If asked about something outside finance, gently redirect.
- Keep answers concise but thorough. Use simple language.
- When comparing months, use actual data from the trend above.
- If the user asks "can I afford X", check their wallet balance and budget remaining.
- Format numbers with ₹ and Indian number formatting when possible.
- Don't make up data — if something isn't in the context, say so.`;

    // Build Gemini conversation history
    const geminiHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply });
  } catch (err) {
    console.error('Chat error:', err);
    if (err.message && err.message.toLowerCase().includes('api key')) {
      return res.status(500).json({ message: 'Gemini API key not configured.', rawError: err.message });
    }
    res.status(500).json({ message: 'Failed to get AI response.', rawError: err.message });
  }
});

module.exports = router;
