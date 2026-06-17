const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/leaderboard
router.get('/', auth, async (req, res) => {
  try {
    // Get all users sorted by career score
    const users = await User.find({})
      .select('name branch careerScore testPercentile')
      .sort({ careerScore: -1 })
      .limit(50);

    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      name: u.name,
      branch: u.branch || 'N/A',
      score: u.careerScore,
      percentile: u.testPercentile > 0 ? `${u.testPercentile}th` : '--',
      isYou: u._id.toString() === req.user._id.toString(),
      initials: u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }));

    // If current user is not in top 50, add them
    const userInList = leaderboard.find(u => u.isYou);
    if (!userInList) {
      const userRank = await User.countDocuments({ careerScore: { $gt: req.user.careerScore } }) + 1;
      leaderboard.push({
        rank: userRank,
        name: req.user.name,
        branch: req.user.branch || 'N/A',
        score: req.user.careerScore,
        percentile: req.user.testPercentile > 0 ? `${req.user.testPercentile}th` : '--',
        isYou: true,
        initials: req.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      });
    }

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
