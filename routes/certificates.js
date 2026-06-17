const router = require('express').Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Certificate = require('../models/Certificate');
const Activity = require('../models/Activity');

// Multer config for certificate uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'certificates');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `cert_${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Only PDF, JPG, PNG files are allowed.'));
  }
});

// POST /api/certificates/upload — Upload and extract skills with Gemini
router.post('/upload', auth, upload.single('certificate'), async (req, res) => {
  try {
    const { certName, issuer, marks, date } = req.body;

    let extractedData;
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `You are an AI skill extractor. A user uploaded a certificate with these details:
Certificate Name: ${certName || 'Unknown'}
Issuer: ${issuer || 'Unknown'}
Marks/Grade: ${marks || 'N/A'}
Date: ${date || 'N/A'}

Based on the certificate name and issuer, extract the relevant technical skills and provide an analysis.

Respond ONLY in this exact JSON format:
{
  "skills": ["skill1", "skill2", "skill3", ...],
  "analysis": "Brief 1-2 sentence analysis of how this certificate helps the career",
  "suggestedName": "Cleaned up certificate name",
  "suggestedIssuer": "Cleaned up issuer name"
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      extractedData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Gemini cert error:', e.message);
      extractedData = null;
    }

    // Fallback
    if (!extractedData) {
      const nameUpper = (certName || '').toUpperCase();
      const skills = [];
      if (nameUpper.includes('AWS') || nameUpper.includes('CLOUD')) skills.push('Cloud', 'AWS');
      if (nameUpper.includes('PYTHON')) skills.push('Python');
      if (nameUpper.includes('REACT')) skills.push('React', 'JavaScript');
      if (nameUpper.includes('DATA')) skills.push('Data Science', 'Analytics');
      if (nameUpper.includes('ML') || nameUpper.includes('MACHINE')) skills.push('ML', 'AI');
      if (nameUpper.includes('SQL') || nameUpper.includes('DATABASE')) skills.push('SQL', 'Database');
      if (nameUpper.includes('JAVA') && !nameUpper.includes('JAVASCRIPT')) skills.push('Java');
      if (nameUpper.includes('NODE')) skills.push('Node.js');
      if (nameUpper.includes('DOCKER') || nameUpper.includes('KUBERNETES')) skills.push('Docker', 'DevOps');
      if (nameUpper.includes('GOOGLE') || nameUpper.includes('ANALYTICS')) skills.push('Analytics', 'SEO');
      if (skills.length === 0) skills.push('Professional Development');

      extractedData = {
        skills,
        analysis: `Certificate in ${certName || 'this field'} demonstrates domain expertise and commitment to learning.`,
        suggestedName: certName || 'Certificate',
        suggestedIssuer: issuer || 'Unknown Issuer'
      };
    }

    // Save certificate
    const cert = await Certificate.create({
      userId: req.user._id,
      name: extractedData.suggestedName || certName || 'Certificate',
      issuer: extractedData.suggestedIssuer || issuer || 'Unknown',
      skills: extractedData.skills,
      marks: marks || 'N/A',
      date: date || new Date().toLocaleDateString(),
      filePath: req.file ? req.file.filename : '',
      aiAnalysis: extractedData.analysis
    });

    // Update user skills and cert count
    const user = await User.findById(req.user._id);
    const newSkills = extractedData.skills.filter(s => !user.skills.includes(s));
    user.skills = [...user.skills, ...newSkills];
    user.certsCount = await Certificate.countDocuments({ userId: user._id });
    user.calculateProfileCompletion();
    user.calculateCareerScore();
    await user.save();

    // Log activity
    await Activity.create({
      userId: req.user._id,
      type: 'cert',
      title: 'Certificate Uploaded',
      description: `${cert.name} · ${extractedData.skills.length} skills extracted`,
      icon: '🎓'
    });

    res.json({
      certificate: cert,
      newSkills,
      careerScore: user.careerScore,
      analysis: extractedData.analysis
    });
  } catch (err) {
    console.error('Cert upload error:', err);
    res.status(500).json({ error: 'Server error during certificate upload.' });
  }
});

// GET /api/certificates — List user's certificates
router.get('/', auth, async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
