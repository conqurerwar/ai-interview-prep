const mongoose = require('mongoose');

const cvReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  atsScore: { type: Number, required: true },
  mistakes: [
    {
      type: { type: String, required: true },
      description: { type: String, required: true }
    }
  ],
  correctedCVText: { type: String },
  fileName: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CVReport', cvReportSchema);
