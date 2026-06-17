const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  issuer: { type: String, default: 'Unknown' },
  skills: [{ type: String }],
  marks: { type: String, default: 'N/A' },
  date: { type: String, default: '' },
  filePath: { type: String, default: '' },
  aiAnalysis: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Certificate', certificateSchema);
