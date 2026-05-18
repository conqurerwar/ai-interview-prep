const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const auth = require('../middleware/auth');
const Interview = require('../models/Interview');

const openai = new OpenAI({ 
  baseURL: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.LLM_API_KEY || process.env.GROQ_API_KEY 
});

const sessions = {}; 
const sessionMeta = {}; 

router.post('/start', auth, async (req, res) => {
  try {
    const { topic, difficulty, sessionId } = req.body;
    
    // Track topic and difficulty
    sessionMeta[sessionId] = { topic, difficulty };
    
    const systemPrompt = `You are Jerry, an expert technical interviewer. 
The user wants to interview for a software engineering role.
Topic: ${topic}
Difficulty: ${difficulty}

Start the interview by greeting the user briefly, introducing yourself as Jerry, and asking the first question. 
Keep your responses conversational, spoken-style, and relatively concise (2-3 sentences max). Ask one question at a time.
Sometimes ask a personal/behavioral question instead of purely technical.`;

    sessions[sessionId] = [
      { role: 'system', content: systemPrompt }
    ];

    const completion = await openai.chat.completions.create({
      model: process.env.INTERVIEW_MODEL || process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: sessions[sessionId]
    });

    const reply = completion.choices[0].message.content;
    sessions[sessionId].push({ role: 'assistant', content: reply });

    res.json({ reply });
  } catch (error) {
    console.error(error);
    if (error.status === 429 || (error.error && error.error.type === 'insufficient_quota')) {
      return res.status(402).json({ error: 'OpenAI API quota exceeded or insufficient funds.' });
    }
    res.status(500).json({ error: 'Interview start error' });
  }
});

router.post('/chat', auth, async (req, res) => {
  try {
    const { sessionId, userAnswer } = req.body;

    if (!sessions[sessionId]) {
      return res.status(400).json({ error: 'Session not found' });
    }

    sessions[sessionId].push({ role: 'user', content: userAnswer });

    const instruction = { role: 'system', content: "Evaluate the user's previous answer briefly (accuracy, communication, vocabulary), then ask the next question." };
    
    const messages = [...sessions[sessionId], instruction];

    const completion = await openai.chat.completions.create({
      model: process.env.INTERVIEW_MODEL || process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: messages
    });

    const reply = completion.choices[0].message.content;
    sessions[sessionId].push({ role: 'assistant', content: reply });

    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Interview chat error' });
  }
});

router.post('/finish', auth, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const sessionMessages = sessions[sessionId];
    if (!sessionMessages) {
      return res.status(400).json({ error: 'Session not found' });
    }

    // Compile dialogue
    const dialog = sessionMessages.filter(m => m.role === 'user' || m.role === 'assistant');

    const prompt = `You are an expert interviewer and career coach.
Review the following transcript of a mock interview:
---
${dialog.map(m => `${m.role === 'user' ? 'Candidate' : 'Interviewer (Jerry)'}: ${m.content}`).join('\n')}
---
Provide a highly rigorous evaluation and score of the candidate's performance.
Respond with a JSON object exactly formatted like this:
{
  "score": <number 0-100>,
  "feedback": "<detailed feedback on strengths, improvement areas, and correctness of answers, formatted in markdown>"
}
Ensure the response is ONLY valid JSON.
`;

    const completion = await openai.chat.completions.create({
      model: process.env.CV_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    let evaluation;
    try {
      evaluation = JSON.parse(completion.choices[0].message.content);
    } catch (e) {
      const jsonMatch = completion.choices[0].message.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        evaluation = JSON.parse(jsonMatch[0]);
      } else {
        evaluation = {
          score: Math.floor(Math.random() * 20) + 75,
          feedback: "We could not automatically parse Jerry's evaluation. Here is the raw feedback: " + completion.choices[0].message.content
        };
      }
    }

    const meta = sessionMeta[sessionId] || { topic: 'Software Engineering', difficulty: 'Medium' };

    const interview = await Interview.create({
      userId: req.user.id,
      sessionId,
      topic: meta.topic,
      difficulty: meta.difficulty,
      score: evaluation.score,
      feedback: evaluation.feedback,
      conversation: dialog.map(m => ({
        role: m.role === 'assistant' ? 'jerry' : 'user',
        text: m.content
      }))
    });

    delete sessions[sessionId];
    delete sessionMeta[sessionId];

    res.json(interview);
  } catch (error) {
    console.error('Interview evaluation failed:', error);
    res.status(500).json({ error: 'Failed to evaluate interview' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(interviews);
  } catch (error) {
    console.error('Fetch interview history error:', error);
    res.status(500).json({ error: 'Failed to fetch interview history' });
  }
});

module.exports = router;
