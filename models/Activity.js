const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['test', 'cert', 'resume', 'job-apply', 'profile', 'course'], required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '⚡' },
}, { timestamps: true });

// Auto-expire old activities after 90 days
activitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('Activity', activitySchema);
