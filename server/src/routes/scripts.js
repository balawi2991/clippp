import express from 'express';
import { generateRandomScript, calculateRecommendedWordCount, estimateDuration } from '../utils/scriptSplitter.js';

const router = express.Router();

// GET /api/scripts/random - Get random script
router.get('/random', (req, res) => {
  const script = generateRandomScript();
  res.json({ script });
});

// POST /api/scripts/estimate - Estimate duration from script
router.post('/estimate', (req, res) => {
  const { script } = req.body;
  
  if (!script) {
    return res.status(400).json({ error: 'Script is required' });
  }
  
  const wordCount = script.trim().split(/\s+/).length;
  const estimatedDuration = estimateDuration(wordCount);
  
  res.json({
    wordCount,
    estimatedDuration: Math.round(estimatedDuration),
    estimatedRange: {
      min: Math.round(estimatedDuration * 0.9),
      max: Math.round(estimatedDuration * 1.1)
    }
  });
});

// GET /api/scripts/recommend-words - Get recommended word count for duration
router.get('/recommend-words', (req, res) => {
  const targetDuration = parseInt(req.query.duration) || 30;
  const recommendedWords = calculateRecommendedWordCount(targetDuration);
  
  res.json({
    targetDuration,
    recommendedWords,
    range: {
      min: Math.round(recommendedWords * 0.9),
      max: Math.round(recommendedWords * 1.1)
    }
  });
});

// POST /api/scripts/generate-from-prompt - Generate script from prompt using AI
router.post('/generate-from-prompt', async (req, res) => {
  try {
    const { prompt, targetDuration = 30, style = 'default', language = 'EN' } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }
    
    // Check if Groq API is available
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'AI service not configured' });
    }
    
    // Calculate word count
    const wordsNeeded = Math.round(targetDuration * 2.5);
    
    // Generate script using Groq
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const styleInstructions = {
      default: 'engaging and inspiring',
      promo: 'promotional and persuasive'
    };
    
    const systemPrompt = `You are a professional script writer for short-form videos. Write natural, engaging scripts that sound like human speech.

Rules:
- Use short sentences (5-10 words each)
- Simple, clear language
- Natural flow
- No hashtags, no special characters
- Write numbers as words (three, not 3)
- Strong opening sentence
- Clear main points
- Powerful closing sentence`;

    const userPrompt = `Write a ${styleInstructions[style] || 'engaging'} script about: "${prompt}"

Requirements:
- Word count: ${wordsNeeded} to ${wordsNeeded + 10} words (minimum ${wordsNeeded}, maximum ${wordsNeeded + 10})
- Duration: ${targetDuration} seconds
- Language: ${language}
- Short sentences (5-10 words each)
- Natural speech style

IMPORTANT: Word count must be between ${wordsNeeded} and ${wordsNeeded + 10} words. Do not go below ${wordsNeeded} or above ${wordsNeeded + 10}.

Write ONLY the script text, no titles or descriptions.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: wordsNeeded * 2,
    });
    
    const script = completion.choices[0].message.content.trim();
    
    // Estimate actual duration
    const actualWordCount = script.split(/\s+/).length;
    const estimatedDuration = Math.round(actualWordCount / 2.5);
    
    res.json({
      script,
      wordCount: actualWordCount,
      estimatedDuration,
      targetDuration
    });
    
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

export default router;
