const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  branch: { type: String, default: '' },
  year: { type: String, default: '' },
  cgpa: { type: String, default: '' },
  skills: [{ type: String }],
  careerScore: { type: Number, default: 10 },
  profileCompletion: { type: Number, default: 20 },
  testPercentile: { type: Number, default: 0 },
  certsCount: { type: Number, default: 0 },
  resumeAtsScore: { type: Number, default: 0 },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate career score
userSchema.methods.calculateCareerScore = function() {
  let score = 10; // base

  // Profile completion contribution (max 15 points)
  score += Math.round(this.profileCompletion * 0.15);

  // Test percentile contribution (max 30 points)
  score += Math.round(this.testPercentile * 0.30);

  // Certificates contribution (max 20 points, 5 per cert, capped at 4)
  score += Math.min(this.certsCount * 5, 20);

  // Skills contribution (max 15 points, 2 per skill, capped)
  score += Math.min(this.skills.length * 2, 15);

  // Resume ATS contribution (max 10 points)
  score += Math.round(this.resumeAtsScore * 0.10);

  // CGPA contribution (max 10 points)
  const cgpa = parseFloat(this.cgpa) || 0;
  score += Math.round((cgpa / 10) * 10);

  this.careerScore = Math.min(score, 100);
  return this.careerScore;
};

// Recalculate profile completion
userSchema.methods.calculateProfileCompletion = function() {
  let completion = 20; // base for having an account
  if (this.name) completion += 10;
  if (this.branch) completion += 15;
  if (this.year) completion += 10;
  if (this.cgpa) completion += 10;
  if (this.skills.length > 0) completion += 15;
  if (this.certsCount > 0) completion += 10;
  if (this.resumeAtsScore > 0) completion += 10;
  this.profileCompletion = Math.min(completion, 100);
  return this.profileCompletion;
};

module.exports = mongoose.model('User', userSchema);
