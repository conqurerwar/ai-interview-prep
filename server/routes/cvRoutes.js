const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const { OpenAI } = require('openai');

const upload = multer({ storage: multer.memoryStorage() });
const openai = new OpenAI({ 
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY 
});

router.post('/check', upload.single('cv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let cvText = '';
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdf(req.file.buffer);
      cvText = data.text;
    } else {
      cvText = req.file.buffer.toString('utf-8');
    }

    const prompt = `You are an expert ATS (Applicant Tracking System) parser and technical recruiter.
Review the following CV text:
---
${cvText}
---
Provide a JSON response with exactly this structure:
{
  "atsScore": <number 0-100>,
  "mistakes": [
    { "type": "<string>", "description": "<string>" }
  ],
  "correctedCVText": "<string formatted in markdown>"
}
Ensure the response is ONLY valid JSON.
`;

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(completion.choices[0].message.content);
    res.json(result);

  } catch (error) {
    console.error('CV check error:', error);
    if (error.status === 429 || (error.error && error.error.type === 'insufficient_quota')) {
      return res.status(402).json({ error: 'OpenAI API quota exceeded or insufficient funds.' });
    }
    res.status(500).json({ error: 'Failed to process CV' });
  }
});

module.exports = router;
