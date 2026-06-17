const router = require('express').Router();
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');

// GET /api/courses — Personalized course recommendations using Gemini AI
router.get('/', auth, async (req, res) => {
  try {
    const user = req.user;
    let courses = [];

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are a career course advisor. Based on this student's profile, recommend 8 specific REAL online courses they should take.

Student Profile:
- Branch: ${user.branch || 'Not specified'}
- Year: ${user.year || 'Not specified'}
- Current Skills: ${user.skills.length > 0 ? user.skills.join(', ') : 'None'}
- Career Score: ${user.careerScore}/100
- Certificates: ${user.certsCount || 0}

Rules:
- Recommend REAL courses from platforms like Coursera, Udemy, edX, Khan Academy, freeCodeCamp, LeetCode
- Mix free and paid courses
- Focus on skill gaps based on their branch
- Each course should have a realistic score boost value (3-15)
- Include courses that will help them reach 85+ career score

Respond ONLY in this JSON array format:
[
  {"title": "Course Name", "provider": "Platform", "duration": "X weeks", "level": "Beginner/Intermediate/Advanced", "free": true/false, "tags": ["tag1", "tag2"], "score_boost": 8, "url": "https://...", "description": "Brief 1-line description"}
]`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        courses = JSON.parse(jsonMatch[0]);
        courses = courses.map((c, i) => ({ id: i + 1, ...c }));
      }
    } catch (e) {
      console.error('Gemini courses error:', e.message);
    }

    // Fallback if Gemini fails - recommend based on branch
    if (courses.length === 0) {
      const branch = (user.branch || '').toUpperCase();
      const userSkills = (user.skills || []).map(s => s.toLowerCase());

      const allCourses = [
        {id:1, title:'CS50: Introduction to Computer Science', provider:'Harvard/edX', duration:'12 weeks', level:'Beginner', free:true, tags:['Programming','C','Python'], score_boost:12, url:'https://cs50.harvard.edu/', description:'Harvard\'s legendary intro to CS'},
        {id:2, title:'Data Structures and Algorithms', provider:'freeCodeCamp', duration:'8 weeks', level:'Intermediate', free:true, tags:['DSA','JavaScript','Problem Solving'], score_boost:15, url:'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', description:'Master DSA with hands-on challenges'},
        {id:3, title:'Machine Learning Specialization', provider:'Coursera/Stanford', duration:'12 weeks', level:'Intermediate', free:false, tags:['ML','Python','AI'], score_boost:14, url:'https://www.coursera.org/specializations/machine-learning-introduction', description:'Andrew Ng\'s ML course'},
        {id:4, title:'The Web Developer Bootcamp', provider:'Udemy', duration:'10 weeks', level:'Beginner', free:false, tags:['HTML','CSS','JavaScript','Node.js'], score_boost:11, url:'https://www.udemy.com/course/the-web-developer-bootcamp/', description:'Full stack web development'},
        {id:5, title:'AWS Cloud Practitioner Essentials', provider:'AWS', duration:'4 weeks', level:'Beginner', free:true, tags:['Cloud','AWS','DevOps'], score_boost:8, url:'https://aws.amazon.com/training/digital/aws-cloud-practitioner-essentials/', description:'Official AWS cloud fundamentals'},
        {id:6, title:'Python for Everybody', provider:'Coursera/UMich', duration:'8 weeks', level:'Beginner', free:true, tags:['Python','Data','Programming'], score_boost:10, url:'https://www.coursera.org/specializations/python', description:'Learn Python from scratch'},
        {id:7, title:'SQL for Data Science', provider:'Coursera/UC Davis', duration:'4 weeks', level:'Beginner', free:true, tags:['SQL','Database','Analytics'], score_boost:7, url:'https://www.coursera.org/learn/sql-for-data-science', description:'Master SQL queries'},
        {id:8, title:'React - The Complete Guide', provider:'Udemy', duration:'8 weeks', level:'Intermediate', free:false, tags:['React','JavaScript','Frontend'], score_boost:11, url:'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', description:'Build modern React apps'},
      ];

      // Filter out courses whose skills user already has
      courses = allCourses.filter(c => {
        const hasAllTags = c.tags.every(t => userSkills.includes(t.toLowerCase()));
        return !hasAllTags;
      });

      if (courses.length < 4) courses = allCourses;
    }

    res.json({ courses, careerScore: user.careerScore });
  } catch (err) {
    console.error('Courses error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/courses/enroll/:id
router.post('/enroll/:id', auth, async (req, res) => {
  try {
    const { title } = req.body;
    await Activity.create({
      userId: req.user._id, type: 'course',
      title: `Enrolled in ${title || 'a course'}`, description: 'Started learning', icon: '📚'
    });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Server error.' }); }
});

module.exports = router;
