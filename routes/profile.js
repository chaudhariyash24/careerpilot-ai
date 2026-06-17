const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Activity = require('../models/Activity');

// GET /api/profile — Get full profile + activities
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    user.calculateProfileCompletion();
    user.calculateCareerScore();
    await user.save();

    const activities = await Activity.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ user, activities });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// PUT /api/profile — Update profile
router.put('/', auth, async (req, res) => {
  try {
    const { name, branch, year, cgpa, skills } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (cgpa) user.cgpa = cgpa;
    if (skills && Array.isArray(skills)) user.skills = skills;

    user.calculateProfileCompletion();
    user.calculateCareerScore();
    await user.save();

    await Activity.create({
      userId: user._id,
      type: 'profile',
      title: 'Profile Updated',
      description: 'Profile details updated successfully',
      icon: '👤'
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        cgpa: user.cgpa,
        skills: user.skills,
        careerScore: user.careerScore,
        profileCompletion: user.profileCompletion,
        testPercentile: user.testPercentile,
        certsCount: user.certsCount,
        resumeAtsScore: user.resumeAtsScore
      }
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
