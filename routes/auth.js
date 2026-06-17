const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

// Generate JWT
function generateToken(user) {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, branch, year } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    // Create user
    const user = new User({ name, email, password, branch: branch || '', year: year || '' });
    user.calculateProfileCompletion();
    user.calculateCareerScore();
    await user.save();

    // Log activity
    await Activity.create({
      userId: user._id,
      type: 'profile',
      title: 'Account Created',
      description: 'Welcome to CareerPilot AI!',
      icon: '🚀'
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        careerScore: user.careerScore,
        profileCompletion: user.profileCompletion
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        year: user.year,
        careerScore: user.careerScore,
        profileCompletion: user.profileCompletion
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    user.calculateProfileCompletion();
    user.calculateCareerScore();
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
