const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  techStack: [{ type: String }],
  githubLink: { type: String, default: '' },
  linkedinPost: { type: String, default: '' },
  liveLink: { type: String, default: '' },
  status: { type: String, enum: ['In Progress', 'Completed', 'On Hold'], default: 'In Progress' },
  thumbnail: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
