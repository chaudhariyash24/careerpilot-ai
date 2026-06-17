const router = require('express').Router();
const auth = require('../middleware/auth');

// POST /api/chat — NOVA AI powered by Gemini
router.post('/', auth, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    // Build context from user profile
    const user = req.user;
    const userContext = `
User Profile:
- Name: ${user.name}
- Branch: ${user.branch || 'Not specified'}
- Year: ${user.year || 'Not specified'}
- CGPA: ${user.cgpa || 'Not specified'}
- Skills: ${user.skills.length > 0 ? user.skills.join(', ') : 'None listed'}
- Career Score: ${user.careerScore}/100
- Profile Completion: ${user.profileCompletion}%
- Test Percentile: ${user.testPercentile > 0 ? user.testPercentile + 'th' : 'Not taken yet'}
- Certificates: ${user.certsCount} uploaded
- Resume ATS Score: ${user.resumeAtsScore > 0 ? user.resumeAtsScore + '/100' : 'Not scanned yet'}
`;

    let aiResponse;
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const systemPrompt = `You are NOVA, an expert AI Career Advisor for the CareerPilot AI platform. You help students in India with career guidance, skill development, job preparation, and academic planning.

Your personality: Friendly, encouraging, data-driven, and practical. Use emojis occasionally. Keep responses concise (2-4 paragraphs max).

${userContext}

Guidelines:
- Give personalized advice based on the user's profile data above
- Suggest specific actions to improve their career score
- Recommend relevant courses, skills, or certifications
- Help with career path decisions, interview prep, and resume tips
- If they ask about salaries, give India-specific ranges
- Always be encouraging but realistic
- If their profile is incomplete, gently suggest filling it out
- Reference their career score and suggest ways to improve it

Previous conversation:
${(history || []).map(h => `${h.role}: ${h.content}`).join('\n').slice(-2000)}

Respond to the user's message naturally and helpfully.`;

      const result = await model.generateContent([
        { text: systemPrompt },
        { text: `User: ${message}` }
      ]);

      aiResponse = result.response.text();
    } catch (e) {
      console.error('Gemini chat error:', e.message);

      // Intelligent fallback
      const msg = message.toLowerCase();
      if (msg.includes('salary') || msg.includes('pay') || msg.includes('package')) {
        aiResponse = `💰 Here are typical salary ranges for tech roles in India (2025):\n\n• Software Engineer (Fresher): ₹3–8 LPA\n• Data Scientist: ₹6–15 LPA\n• ML Engineer: ₹8–20 LPA\n• Full Stack Developer: ₹5–15 LPA\n• DevOps Engineer: ₹6–18 LPA\n\nYour career score is ${user.careerScore}/100. ${user.careerScore >= 80 ? 'You\'re well-positioned for premium placements!' : 'Aim for 80+ to unlock premium opportunities!'}`;
      } else if (msg.includes('skill') || msg.includes('learn')) {
        aiResponse = `🔑 Top skills in demand for 2025:\n\n• AI/ML & Prompt Engineering\n• Cloud Computing (AWS/Azure/GCP)\n• Full Stack Development (React + Node)\n• Data Science & Analytics\n• DevOps & CI/CD\n\nBased on your profile, I'd recommend focusing on ${user.skills.length > 0 ? 'expanding beyond ' + user.skills.slice(0, 3).join(', ') : 'building foundational skills first'}. Check the Courses section for personalized recommendations! 📚`;
      } else if (msg.includes('resume') || msg.includes('cv')) {
        aiResponse = `📄 Resume Tips for ATS Success:\n\n• Keep it to 1 page for freshers\n• Use action verbs: Developed, Optimized, Implemented\n• Add quantifiable results (e.g., "Improved load time by 40%")\n• Include GitHub/portfolio links\n• Use ATS-friendly format (no tables, clean headings)\n\n${user.resumeAtsScore > 0 ? `Your current ATS score is ${user.resumeAtsScore}/100.` : 'Upload your resume in the ATS Scanner section for a detailed analysis!'} 🚀`;
      } else if (msg.includes('interview') || msg.includes('prepare')) {
        aiResponse = `🎯 Interview Preparation Tips:\n\n1. **DSA Practice**: Solve 2-3 problems daily on LeetCode\n2. **System Design**: Study common patterns (load balancing, caching)\n3. **Projects**: Be ready to explain your projects in depth\n4. **Behavioral**: Use the STAR method for HR questions\n5. **Mock Interviews**: Practice with peers or Pramp\n\nYour career score of ${user.careerScore}/100 shows ${user.careerScore >= 70 ? 'good preparation!' : 'room for improvement. Focus on aptitude tests and certifications.'} 💪`;
      } else {
        aiResponse = `Great question about "${message}"! 🤖\n\nBased on your profile (Career Score: ${user.careerScore}/100, ${user.skills.length} skills), I'd recommend:\n\n1. ${user.careerScore < 70 ? 'Take the Aptitude Test to boost your score' : 'Focus on advanced certifications'}\n2. ${user.certsCount < 3 ? 'Upload more certificates for skill recognition' : 'Keep building practical projects'}\n3. ${user.resumeAtsScore === 0 ? 'Scan your resume for ATS optimization' : 'Apply to matching job listings'}\n\nWould you like more specific guidance on any of these? I'm here to help! 💡`;
      }
    }

    res.json({ response: aiResponse });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Server error during chat.' });
  }
});

module.exports = router;
