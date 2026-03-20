const express = require('express');
const router = express.Router();
const axios = require('axios');
const { protect } = require('../middleware/auth');

const TECH_SYSTEM_PROMPT = `You are TechMentor, an expert AI career advisor specialized exclusively in technology, programming, software development, and tech careers. 

You ONLY answer questions related to:
- Programming languages (Python, JavaScript, Java, C++, Rust, Go, etc.)
- Frameworks and libraries (React, Node.js, Django, Spring, etc.)
- Computer Science concepts (algorithms, data structures, OS, networking, etc.)
- Tech careers (internships, job interviews, resume tips, roadmaps)
- Cloud computing, DevOps, AI/ML, cybersecurity
- Software engineering best practices
- Tech industry trends and news

If asked anything outside tech/programming/career topics, politely redirect with: "I'm TechMentor, your tech career advisor. I can only help with technology, programming, and career questions. Please ask me something tech-related!"

Keep responses concise, practical, and encouraging for students.`;

router.post('/chat', protect, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages))
      return res.status(400).json({ message: 'Messages array required' });

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: TECH_SYSTEM_PROMPT },
          ...messages.slice(-10) // keep last 10 messages for context
        ],
        max_tokens: 1024,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('Groq error:', err.response?.data || err.message);
    res.status(500).json({ message: 'AI service error', error: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
