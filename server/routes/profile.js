const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// GET /api/profile
router.get('/', protect, async (req, res) => {
  res.json(req.user);
});

// PUT /api/profile
router.put('/', protect, async (req, res) => {
  try {
    const { name, email, walletBalance, monthlyBudget, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name.trim();
    if (email) user.email = email.toLowerCase().trim();
    if (walletBalance !== undefined) user.walletBalance = Number(walletBalance);
    if (monthlyBudget !== undefined) user.monthlyBudget = Number(monthlyBudget);

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      walletBalance: user.walletBalance,
      monthlyBudget: user.monthlyBudget,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    if (err.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

module.exports = router;
