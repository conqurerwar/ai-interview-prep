const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { OpenAI } = require('openai');
const auth = require('../middleware/auth');
const CVReport = require('../models/CVReport');

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});
const openai = new OpenAI({
  baseURL: process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.LLM_API_KEY || process.env.GROQ_API_KEY
});

router.post('/check', auth, upload.single('cv'), async (req, res) => {
  req.setTimeout(90000); // 90 seconds timeout
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let cvText = '';
    if (req.file.mimetype === 'application/pdf') {
      const data = await pdf(req.file.buffer);
      cvText = data.text;
    } else if (req.file.originalname.endsWith('.docx') || req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ buffer: req.file.buffer });
      cvText = data.value;
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
      model: process.env.CV_MODEL || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    });

    let rawContent = completion.choices[0].message.content;
    let result;
    try {
      result = JSON.parse(rawContent);
    } catch (e) {
      // If parsing fails, try to extract JSON using regex
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse JSON response from AI: ' + rawContent.substring(0, 50));
      }
    }
    
    await CVReport.create({
      userId: req.user.id,
      atsScore: result.atsScore,
      mistakes: result.mistakes || [],
      correctedCVText: result.correctedCVText,
      fileName: req.file ? req.file.originalname : 'CV.pdf'
    });
    
    res.json(result);

  } catch (error) {
    console.error('CV check error details:', error.message || error);
    if (error.status === 429 || (error.error && error.error.type === 'insufficient_quota')) {
      return res.status(402).json({ error: 'OpenAI API quota exceeded or insufficient funds.' });
    }
    res.status(500).json({ error: error.message || 'Failed to process CV' });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const reports = await CVReport.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Fetch CV history error:', error);
    res.status(500).json({ error: 'Failed to fetch CV history' });
  }
});

module.exports = router;
