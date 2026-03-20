const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// GET profile
router.get('/', protect, async (req, res) => {
  res.json(req.user);
});

// PUT update profile
router.put('/', protect, async (req, res) => {
  try {
    const allowedFields = ['name', 'bio', 'college', 'graduation', 'github', 'linkedin', 'portfolio', 'avatar'];
    const updates = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -otp -otpExpiry');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
