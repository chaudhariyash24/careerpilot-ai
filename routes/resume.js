const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Activity = require('../models/Activity');

// Multer config for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'resumes');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `resume_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, DOC, DOCX files are allowed.'));
  }
});

// POST /api/resume/analyze — Upload and analyze resume with Gemini
router.post('/analyze', auth, upload.single('resume'), async (req, res) => {
  try {
    let resumeText = '';

    // Try to extract text from PDF
    if (req.file && req.file.path.endsWith('.pdf')) {
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } catch (e) {
        resumeText = 'Could not extract text from PDF.';
      }
    } else if (req.body.resumeText) {
      resumeText = req.body.resumeText;
    } else {
      resumeText = 'Resume uploaded but text extraction not available for this format.';
    }

    // Analyze with Gemini AI
    let analysis;
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are an expert ATS (Applicant Tracking System) resume analyzer. Analyze this resume and provide:
1. An ATS score out of 100
2. A list of missing important keywords (for tech/engineering roles)
3. A list of found keywords
4. 5 specific improvement suggestions

Resume Text:
${resumeText.slice(0, 4000)}

Respond ONLY in this exact JSON format:
{
  "atsScore": <number>,
  "missingKeywords": ["keyword1", "keyword2", ...],
  "foundKeywords": ["keyword1", "keyword2", ...],
  "improvements": ["tip1", "tip2", ...],
  "summary": "Brief 1-2 sentence summary of the resume quality"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Gemini API error:', e.message);
      analysis = null;
    }

    // Fallback if Gemini fails
    if (!analysis) {
      const techKeywords = ['Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'Git', 'AWS', 'Docker', 'Kubernetes', 'CI/CD', 'System Design', 'REST API', 'GraphQL', 'Redis', 'MongoDB', 'TypeScript', 'Java', 'Machine Learning'];
      const found = techKeywords.filter(k => resumeText.toLowerCase().includes(k.toLowerCase()));
      const missing = techKeywords.filter(k => !resumeText.toLowerCase().includes(k.toLowerCase()));

      analysis = {
        atsScore: Math.min(40 + found.length * 4, 95),
        missingKeywords: missing.slice(0, 8),
        foundKeywords: found,
        improvements: [
          'Add quantifiable achievements (e.g., "Improved performance by 30%")',
          'Include more technical keywords relevant to your target role',
          'Add a professional summary at the top of your resume',
          'Use action verbs: Developed, Optimized, Implemented',
          'Include project links (GitHub, deployment URLs)'
        ],
        summary: `Resume contains ${found.length} key technical terms. ${found.length > 5 ? 'Good keyword coverage.' : 'Needs more technical keywords.'}`
      };
    }

    // Update user ATS score
    const user = await User.findById(req.user._id);
    user.resumeAtsScore = Math.max(user.resumeAtsScore, analysis.atsScore);
    user.calculateProfileCompletion();
    user.calculateCareerScore();
    await user.save();

    // Log activity
    await Activity.create({
      userId: req.user._id,
      type: 'resume',
      title: 'Resume ATS Scanned',
      description: `ATS Score: ${analysis.atsScore}/100`,
      icon: '📄'
    });

    res.json({
      ...analysis,
      careerScore: user.careerScore,
      filePath: req.file ? req.file.filename : null
    });
  } catch (err) {
    console.error('Resume analyze error:', err);
    res.status(500).json({ error: 'Server error during resume analysis.' });
  }
});

module.exports = router;
