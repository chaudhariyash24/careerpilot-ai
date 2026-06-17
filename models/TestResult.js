const mongoose = require('mongoose');

const testResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  percentile: { type: Number, default: 0 },
  timeTaken: { type: Number, default: 0 }, // in minutes
  sectionBreakdown: [{
    section: String,
    correct: Number,
    total: Number,
    percentage: Number
  }],
  answers: [{ type: Number }],
}, { timestamps: true });

module.exports = mongoose.model('TestResult', testResultSchema);
