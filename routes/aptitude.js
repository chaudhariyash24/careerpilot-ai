const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const TestResult = require('../models/TestResult');
const Activity = require('../models/Activity');

// Fetch real questions from Open Trivia DB API
async function fetchQuestions() {
  const categories = [
    { id: 9, name: 'General Knowledge' },
    { id: 18, name: 'Computers' },
    { id: 19, name: 'Mathematics' }
  ];

  let allQuestions = [];

  for (const cat of categories) {
    try {
      const res = await fetch(
        `https://opentdb.com/api.php?amount=5&category=${cat.id}&type=multiple&difficulty=medium`
      );
      const data = await res.json();

      if (data.response_code === 0 && data.results) {
        const mapped = data.results.map(q => {
          // Shuffle options (correct + incorrect)
          const options = [...q.incorrect_answers, q.correct_answer]
            .map(o => decodeHTMLEntities(o))
            .sort(() => Math.random() - 0.5);

          const correctIndex = options.indexOf(decodeHTMLEntities(q.correct_answer));

          return {
            question: decodeHTMLEntities(q.question),
            options,
            correctAnswer: correctIndex,
            section: cat.name,
            difficulty: q.difficulty
          };
        });
        allQuestions = allQuestions.concat(mapped);
      }
    } catch (e) {
      console.error(`Error fetching ${cat.name} questions:`, e.message);
    }
  }

  // If API failed, return empty - frontend will show error
  return allQuestions;
}

function decodeHTMLEntities(text) {
  const entities = {
    '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
    '&#039;': "'", '&apos;': "'",
    '&eacute;': 'e', '&Eacute;': 'E', '&ouml;': 'o',
    '&uuml;': 'u', '&ntilde;': 'n',
    '&ldquo;': '"', '&rdquo;': '"',
    '&lsquo;': "'", '&rsquo;': "'"
  };
  return text.replace(/&[^;]+;/g, function(match) { return entities[match] || match; });
}

// GET /api/aptitude/questions
router.get('/questions', auth, async (req, res) => {
  try {
    const questions = await fetchQuestions();

    if (questions.length === 0) {
      return res.status(503).json({ error: 'Could not fetch questions from API. Please try again.' });
    }

    // Build answer key and send questions without answers
    const answerKey = questions.map(q => q.correctAnswer);
    const clientQuestions = questions.map((q, i) => ({
      id: i,
      question: q.question,
      options: q.options,
      section: q.section
    }));

    res.json({
      questions: clientQuestions,
      _key: Buffer.from(JSON.stringify(answerKey)).toString('base64')
    });
  } catch (err) {
    console.error('Aptitude error:', err);
    res.status(500).json({ error: 'Server error fetching questions.' });
  }
});

// POST /api/aptitude/submit
router.post('/submit', auth, async (req, res) => {
  try {
    const { answers, _key, timeTaken, sections } = req.body;
    if (!answers || !_key) return res.status(400).json({ error: 'Answers and key required.' });

    const answerKey = JSON.parse(Buffer.from(_key, 'base64').toString());
    const totalQuestions = answerKey.length;
    let correct = 0;

    // Grade
    answers.forEach((a, i) => { if (a === answerKey[i]) correct++; });

    // Section breakdown
    const sectionNames = sections || ['General Knowledge', 'Computers', 'Mathematics'];
    const sectionBreakdown = sectionNames.map((sec, si) => {
      const start = si * 5, end = Math.min(start + 5, totalQuestions);
      let secCorrect = 0;
      for (let i = start; i < end; i++) { if (answers[i] === answerKey[i]) secCorrect++; }
      const total = end - start;
      return { section: sec, correct: secCorrect, total, percentage: Math.round((secCorrect / total) * 100) };
    });

    const scorePercent = (correct / totalQuestions) * 100;
    const percentile = Math.round(40 + scorePercent * 0.6);

    // Save result
    await TestResult.create({
      userId: req.user._id, score: correct, totalQuestions, percentile,
      timeTaken: timeTaken || 0, sectionBreakdown, answers
    });

    // Update user
    const user = await User.findById(req.user._id);
    user.testPercentile = Math.max(user.testPercentile, percentile);
    user.calculateProfileCompletion();
    user.calculateCareerScore();
    await user.save();

    await Activity.create({
      userId: req.user._id, type: 'test', title: 'Aptitude Test Completed',
      description: `Score: ${correct}/${totalQuestions} · ${percentile}th percentile`, icon: '📝'
    });

    res.json({ score: correct, totalQuestions, percentile, timeTaken: timeTaken || 0, sectionBreakdown, careerScore: user.careerScore });
  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
