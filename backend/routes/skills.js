const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const { protect } = require('../middleware/auth');

// GET all skills for user
router.get('/', protect, async (req, res) => {
  try {
    const skills = await Skill.find({ user: req.user._id }).sort('-addedAt');
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST add skill
router.post('/', protect, async (req, res) => {
  try {
    const skill = await Skill.create({ ...req.body, user: req.user._id });
    res.status(201).json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update skill
router.put('/:id', protect, async (req, res) => {
  try {
    const skill = await Skill.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!skill) return res.status(404).json({ message: 'Skill not found' });
    res.json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE skill
router.delete('/:id', protect, async (req, res) => {
  try {
    await Skill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
