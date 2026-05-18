const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sessionId: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  difficulty: { type: String, required: true },
  score: { type: Number },
  feedback: { type: String },
  conversation: [
    {
      role: { type: String, required: true }, // 'jerry' or 'user'
      text: { type: String, required: true }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);
