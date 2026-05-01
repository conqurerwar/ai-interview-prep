const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const openai = new OpenAI({ 
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY 
});

const sessions = {}; 

router.post('/start', async (req, res) => {
  try {
    const { topic, difficulty, sessionId } = req.body;
    
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
      model: 'llama-3.1-8b-instant',
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

router.post('/chat', async (req, res) => {
  try {
    const { sessionId, userAnswer } = req.body;

    if (!sessions[sessionId]) {
      return res.status(400).json({ error: 'Session not found' });
    }

    sessions[sessionId].push({ role: 'user', content: userAnswer });

    const instruction = { role: 'system', content: "Evaluate the user's previous answer briefly (accuracy, communication, vocabulary), then ask the next question." };
    
    const messages = [...sessions[sessionId], instruction];

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
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

module.exports = router;
