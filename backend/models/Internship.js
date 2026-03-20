const mongoose = require('mongoose');

const internshipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  status: {
    type: String,
    enum: ['Wishlist', 'Applied', 'OA', 'Interview', 'Offer', 'Rejected'],
    default: 'Wishlist'
  },
  appliedDate: { type: Date },
  notes: { type: String, default: '' },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Internship', internshipSchema);
