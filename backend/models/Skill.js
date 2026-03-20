const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: {
    type: String,
    enum: ['Frontend', 'Backend', 'AI/ML', 'DevOps', 'Mobile', 'Database', 'Cloud', 'Other'],
    default: 'Other'
  },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'], default: 'Beginner' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  isTrending: { type: Boolean, default: false },
  certificationLink: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', skillSchema);
