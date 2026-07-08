const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Challenge = require('../models/Challenge');
const Streak = require('../models/Streak');
const Transaction = require('../models/Transaction');

// ─── Preset Challenges ───
const PRESET_CHALLENGES = [
  {
    id: 'no_spend_3',
    title: '3-Day No Spend',
    description: 'Go 3 consecutive days without any expenses',
    type: 'no_spend_day',
    icon: '🔥',
    target: 3,
    unit: 'days',
    duration: 7,
    badge: { name: 'Frugal Starter', icon: '🌱', color: '#10b981' },
  },
  {
    id: 'no_spend_7',
    title: '7-Day No Spend',
    description: 'Go 7 consecutive days without spending. Legendary!',
    type: 'no_spend_day',
    icon: '💎',
    target: 7,
    unit: 'days',
    duration: 14,
    badge: { name: 'Diamond Hands', icon: '💎', color: '#6366f1' },
  },
  {
    id: 'budget_week',
    title: 'Budget Guardian',
    description: 'Stay under your daily budget average for 7 days straight',
    type: 'budget_week',
    icon: '🛡️',
    target: 7,
    unit: 'days',
    duration: 7,
    badge: { name: 'Budget Shield', icon: '🛡️', color: '#0ea5e9' },
  },
  {
    id: 'food_cap_5k',
    title: 'Meal Planner',
    description: 'Keep food spending under ₹5,000 this month',
    type: 'category_cap',
    icon: '🍽️',
    target: 5000,
    unit: '₹',
    duration: 30,
    category: 'Food & Dining',
    badge: { name: 'Chef Mode', icon: '👨‍🍳', color: '#f59e0b' },
  },
  {
    id: 'shopping_cap_3k',
    title: 'Shopping Detox',
    description: 'Keep shopping expenses under ₹3,000 this month',
    type: 'category_cap',
    icon: '🛍️',
    target: 3000,
    unit: '₹',
    duration: 30,
    category: 'Shopping',
    badge: { name: 'Minimalist', icon: '✨', color: '#ec4899' },
  },
  {
    id: 'save_10k',
    title: 'Save ₹10,000',
    description: 'Accumulate ₹10,000 in net savings this month',
    type: 'savings_target',
    icon: '💰',
    target: 10000,
    unit: '₹',
    duration: 30,
    badge: { name: 'Money Maker', icon: '💰', color: '#22c55e' },
  },
  {
    id: 'save_25k',
    title: 'Save ₹25,000',
    description: 'Accumulate ₹25,000 in net savings this month',
    type: 'savings_target',
    icon: '🏦',
    target: 25000,
    unit: '₹',
    duration: 30,
    badge: { name: 'Vault Master', icon: '🏦', color: '#8b5cf6' },
  },
  {
    id: 'log_streak_7',
    title: '7-Day Logger',
    description: 'Log at least one transaction every day for 7 days',
    type: 'transaction_streak',
    icon: '📝',
    target: 7,
    unit: 'days',
    duration: 10,
    badge: { name: 'Consistent', icon: '📝', color: '#14b8a6' },
  },
  {
    id: 'log_streak_30',
    title: '30-Day Logger',
    description: 'Log at least one transaction every day for 30 days',
    type: 'transaction_streak',
    icon: '🏆',
    target: 30,
    unit: 'days',
    duration: 35,
    badge: { name: 'Legendary Logger', icon: '🏆', color: '#f97316' },
  },
  {
    id: 'entertainment_cap',
    title: 'Entertainment Diet',
    description: 'Keep entertainment spending under ₹2,000 this month',
    type: 'category_cap',
    icon: '🎬',
    target: 2000,
    unit: '₹',
    duration: 30,
    category: 'Entertainment',
    badge: { name: 'Zen Mode', icon: '🧘', color: '#a855f7' },
  },
];

// Helper: calculate progress for a challenge
async function calculateProgress(challenge, userId) {
  const now = new Date();
  const start = new Date(challenge.startDate);

  switch (challenge.type) {
    case 'no_spend_day': {
      let consecutiveDays = 0;
      for (let i = 0; i < challenge.target + 7; i++) {
        const day = new Date(now);
        day.setDate(now.getDate() - i);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        if (dayStart < start) break;

        const expenses = await Transaction.countDocuments({
          userId,
          type: 'expense',
          date: { $gte: dayStart, $lt: dayEnd },
        });

        if (expenses === 0) {
          consecutiveDays++;
        } else {
          break;
        }
      }
      return Math.min(consecutiveDays, challenge.target);
    }

    case 'budget_week': {
      const user = await require('../models/User').findById(userId);
      const dailyBudget = (user.monthlyBudget || 0) / 30;
      let underBudgetDays = 0;

      for (let i = 0; i < challenge.target; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        if (dayStart > now) break;

        const dayExpenses = await Transaction.find({
          userId,
          type: 'expense',
          date: { $gte: dayStart, $lt: dayEnd },
        });
        const dayTotal = dayExpenses.reduce((s, t) => s + t.amount, 0);

        if (dayTotal <= dailyBudget) {
          underBudgetDays++;
        }
      }
      return underBudgetDays;
    }

    case 'category_cap': {
      const catExpenses = await Transaction.find({
        userId,
        type: 'expense',
        category: challenge.category,
        date: { $gte: start, $lte: now },
      });
      const catTotal = catExpenses.reduce((s, t) => s + t.amount, 0);
      // For category cap, progress = how much of budget is remaining (inverted)
      return catTotal;
    }

    case 'savings_target': {
      const transactions = await Transaction.find({
        userId,
        date: { $gte: start, $lte: now },
      });
      const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return Math.max(0, income - expense);
    }

    case 'transaction_streak': {
      let streakDays = 0;
      for (let i = 0; i < challenge.target + 5; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        if (dayStart > now) break;

        const count = await Transaction.countDocuments({
          userId,
          date: { $gte: dayStart, $lt: dayEnd },
        });

        if (count > 0) {
          streakDays++;
        } else {
          // For transaction streak, any gap breaks it if the day has passed
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (dayStart < todayStart) {
            streakDays = 0; // Reset — but keep counting from last gap
          }
        }
      }
      return streakDays;
    }

    default:
      return 0;
  }
}

// GET /api/challenges — user's active & completed challenges
router.get('/', protect, async (req, res) => {
  try {
    const challenges = await Challenge.find({ userId: req.user._id }).sort({ createdAt: -1 });

    // Update progress for active challenges
    const updated = [];
    for (const challenge of challenges) {
      if (challenge.status === 'active') {
        const progress = await calculateProgress(challenge, req.user._id);
        challenge.progress = progress;

        // Check if completed
        if (challenge.type === 'category_cap') {
          // Category cap: completed if still under target at end date
          if (new Date() > challenge.endDate && progress <= challenge.target) {
            challenge.status = 'completed';
          } else if (progress > challenge.target) {
            challenge.status = 'failed';
          }
        } else {
          if (progress >= challenge.target) {
            challenge.status = 'completed';
          } else if (new Date() > challenge.endDate) {
            challenge.status = 'failed';
          }
        }

        await challenge.save();
      }
      updated.push(challenge);
    }

    res.json(updated);
  } catch (err) {
    console.error('Get challenges error:', err);
    res.status(500).json({ message: 'Failed to load challenges' });
  }
});

// GET /api/challenges/available — preset challenges not yet joined
router.get('/available', protect, async (req, res) => {
  try {
    const active = await Challenge.find({
      userId: req.user._id,
      status: 'active',
    });
    const activeIds = active.map((c) => c.challengeId);

    const available = PRESET_CHALLENGES.filter((p) => !activeIds.includes(p.id));
    res.json(available);
  } catch (err) {
    console.error('Available challenges error:', err);
    res.status(500).json({ message: 'Failed to load available challenges' });
  }
});

// POST /api/challenges/join/:id — join a preset challenge
router.post('/join/:id', protect, async (req, res) => {
  try {
    const preset = PRESET_CHALLENGES.find((p) => p.id === req.params.id);
    if (!preset) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    // Check if already active
    const existing = await Challenge.findOne({
      userId: req.user._id,
      challengeId: preset.id,
      status: 'active',
    });
    if (existing) {
      return res.status(400).json({ message: 'Already joined this challenge' });
    }

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + preset.duration);

    const challenge = await Challenge.create({
      userId: req.user._id,
      challengeId: preset.id,
      title: preset.title,
      description: preset.description,
      type: preset.type,
      icon: preset.icon,
      target: preset.target,
      unit: preset.unit,
      category: preset.category,
      endDate,
      badge: preset.badge,
    });

    res.status(201).json(challenge);
  } catch (err) {
    console.error('Join challenge error:', err);
    res.status(500).json({ message: 'Failed to join challenge' });
  }
});

// DELETE /api/challenges/:id — abandon a challenge
router.delete('/:id', protect, async (req, res) => {
  try {
    const challenge = await Challenge.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    res.json({ message: 'Challenge abandoned' });
  } catch (err) {
    console.error('Delete challenge error:', err);
    res.status(500).json({ message: 'Failed to delete challenge' });
  }
});

// GET /api/challenges/streaks — user's streaks
router.get('/streaks', protect, async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Calculate no-spend streak
    let noSpendCount = 0;
    for (let i = 1; i <= 365; i++) {
      const day = new Date(todayStart);
      day.setDate(todayStart.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const expenses = await Transaction.countDocuments({
        userId: req.user._id,
        type: 'expense',
        date: { $gte: day, $lt: dayEnd },
      });

      if (expenses === 0) {
        noSpendCount++;
      } else {
        break;
      }
    }

    // Calculate daily log streak
    let logCount = 0;
    for (let i = 0; i <= 365; i++) {
      const day = new Date(todayStart);
      day.setDate(todayStart.getDate() - i);
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const count = await Transaction.countDocuments({
        userId: req.user._id,
        date: { $gte: day, $lt: dayEnd },
      });

      if (count > 0) {
        logCount++;
      } else {
        break;
      }
    }

    // Get badges (from completed challenges)
    const completedChallenges = await Challenge.find({
      userId: req.user._id,
      status: 'completed',
    });
    const badges = completedChallenges
      .filter((c) => c.badge?.name)
      .map((c) => ({
        name: c.badge.name,
        icon: c.badge.icon,
        color: c.badge.color,
        earnedAt: c.updatedAt,
        challengeTitle: c.title,
      }));

    res.json({
      streaks: {
        noSpend: noSpendCount,
        dailyLog: logCount,
      },
      badges,
    });
  } catch (err) {
    console.error('Get streaks error:', err);
    res.status(500).json({ message: 'Failed to load streaks' });
  }
});

module.exports = router;
