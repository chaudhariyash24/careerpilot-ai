const router = require('express').Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// Jobs database - real-looking jobs with score requirements
const jobsData = [
  {id:1, title:'Software Engineer Intern', company:'Google', location:'Bangalore', type:'Internship', salary:'₹60K/mo', skills:['Python','React','GCP'], minScore:85},
  {id:2, title:'ML Engineer Intern', company:'Microsoft', location:'Hyderabad', type:'Internship', salary:'₹50K/mo', skills:['Python','ML','TensorFlow'], minScore:85},
  {id:3, title:'AI Research Intern', company:'DeepMind', location:'Remote', type:'Internship', salary:'₹80K/mo', skills:['Python','PyTorch','Research'], minScore:90},
  {id:4, title:'Full Stack Developer', company:'Swiggy', location:'Bangalore', type:'Full-Time', salary:'₹10–15 LPA', skills:['Node.js','React','MongoDB'], minScore:85},
  {id:5, title:'Frontend Developer', company:'Razorpay', location:'Remote', type:'Full-Time', salary:'₹8–12 LPA', skills:['React','CSS','TypeScript'], minScore:85},
  {id:6, title:'Backend Developer', company:'Phonepe', location:'Pune', type:'Full-Time', salary:'₹12–18 LPA', skills:['Java','Spring Boot','Kafka'], minScore:88},
  {id:7, title:'Data Science Intern', company:'Flipkart', location:'Mumbai', type:'Internship', salary:'₹45K/mo', skills:['Python','Pandas','SQL'], minScore:85},
  {id:8, title:'DevOps Intern', company:'Amazon', location:'Bangalore', type:'Internship', salary:'₹55K/mo', skills:['AWS','Docker','Linux'], minScore:86},
  {id:9, title:'Cloud Engineer', company:'TCS', location:'Chennai', type:'Full-Time', salary:'₹7–11 LPA', skills:['AWS','Azure','Terraform'], minScore:85},
  {id:10, title:'React Native Developer', company:'Zomato', location:'Remote', type:'Full-Time', salary:'₹8–14 LPA', skills:['React Native','JavaScript','Firebase'], minScore:85},
];

function calculateMatch(job, userSkills, userScore) {
  const skillMatch = job.skills.filter(s =>
    userSkills.some(us => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
  ).length / job.skills.length;
  const scoreMatch = Math.min(userScore / job.minScore, 1);
  return Math.round((skillMatch * 0.6 + scoreMatch * 0.4) * 100);
}

// GET /api/jobs — Only show jobs if career score >= 85
router.get('/', auth, async (req, res) => {
  try {
    const userScore = req.user.careerScore || 0;

    // If score < 85, return empty with message
    if (userScore < 85) {
      return res.json({
        eligible: false,
        score: userScore,
        requiredScore: 85,
        message: `Your career score is ${userScore}/100. You need 85+ to unlock job & internship recommendations. Focus on courses, aptitude tests, and certificates to boost your score!`,
        jobs: []
      });
    }

    const { type, location } = req.query;
    let jobs = [...jobsData];
    if (type && type !== 'All Types') jobs = jobs.filter(j => j.type === type);
    if (location && location !== 'All Locations') jobs = jobs.filter(j => j.location === location);

    const userSkills = req.user.skills || [];
    jobs = jobs.filter(j => userScore >= j.minScore).map(j => ({
      ...j, match: calculateMatch(j, userSkills, userScore)
    })).sort((a, b) => b.match - a.match);

    res.json({ eligible: true, score: userScore, jobs });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/jobs/apply/:id
router.post('/apply/:id', auth, async (req, res) => {
  try {
    const job = jobsData.find(j => j.id === parseInt(req.params.id));
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (req.user.careerScore < 85) return res.status(403).json({ error: 'Career score too low.' });

    await Activity.create({
      userId: req.user._id, type: 'job-apply',
      title: `Applied to ${job.title}`, description: `${job.company} · ${job.location}`, icon: '💼'
    });
    res.json({ success: true, message: `Applied to ${job.title} at ${job.company}!` });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
