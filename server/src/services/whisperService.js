/**
 * Whisper Service - Audio transcription with word-level timestamps using Groq
 */

import Groq from 'groq-sdk';
import fs from 'fs';

// Initialize Groq client lazily
let groq = null;
function getGroqClient() {
  if (!groq) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
}

/**
 * Transcribe audio file and get word-level timestamps
 * @param {string} audioPath - Path to audio file
 * @returns {Promise<Object>} Transcription with word timestamps
 */
export async function transcribeAudioWithTimestamps(audioPath) {
  try {
    // Check if Groq Whisper is enabled
    if (!process.env.GROQ_API_KEY) {
      console.log('Groq API key not found, skipping transcription');
      return null;
    }

    console.log(`Transcribing audio: ${audioPath}`);
    
    const client = getGroqClient();
    
    // Read audio file
    const audioFile = fs.createReadStream(audioPath);
    
    // Transcribe with word-level timestamps
    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo", // Fast and accurate
      response_format: "verbose_json",
      timestamp_granularities: ["word"]
    });

    // Verify we got word timestamps
    if (!transcription.words || transcription.words.length === 0) {
      console.warn('No word timestamps received from Whisper');
      return null;
    }

    console.log(`Transcription complete: ${transcription.words.length} words, duration: ${transcription.duration?.toFixed(2)}s`);
    
    return {
      text: transcription.text,
      duration: transcription.duration,
      words: transcription.words.map(w => ({
        word: w.word,
        start: w.start,
        end: w.end
      }))
    };
    
  } catch (error) {
    console.error('Whisper transcription error:', error);
    return null;
  }
}

/**
 * Transcribe multiple audio files and merge timestamps
 * @param {Array} audioFiles - Array of audio file paths
 * @returns {Promise<Object>} Combined transcription with adjusted timestamps
 */
export async function transcribeMultipleAudios(audioFiles) {
  const transcriptions = [];
  let cumulativeTime = 0;

  for (let i = 0; i < audioFiles.length; i++) {
    const audioPath = audioFiles[i];
    
    if (!audioPath || !fs.existsSync(audioPath)) {
      console.warn(`Audio file not found: ${audioPath}`);
      continue;
    }

    const transcription = await transcribeAudioWithTimestamps(audioPath);
    
    if (!transcription) {
      console.warn(`Failed to transcribe: ${audioPath}`);
      continue;
    }

    // Adjust timestamps based on cumulative time
    const adjustedWords = transcription.words.map(w => ({
      word: w.word,
      start: w.start + cumulativeTime,
      end: w.end + cumulativeTime
    }));

    transcriptions.push({
      sceneIndex: i,
      text: transcription.text,
      duration: transcription.duration,
      words: adjustedWords
    });

    cumulativeTime += transcription.duration;
  }

  // Merge all words
  const allWords = transcriptions.flatMap(t => t.words);
  const fullText = transcriptions.map(t => t.text).join(' ');

  return {
    text: fullText,
    duration: cumulativeTime,
    words: allWords,
    scenes: transcriptions
  };
}

/**
 * Create smart caption blocks with hybrid intelligent splitting
 * Uses punctuation, natural pauses, and optimal duration
 * 
 * الطريقة الهجينة الذكية:
 * - تراعي علامات الترقيم (. , ! ? ; :)
 * - تكتشف الوقفات الطبيعية (150ms+)
 * - تحافظ على مدة مثالية (1.2 ثانية)
 * - مرنة (1-5 كلمات حسب السياق)
 * 
 * @param {Array} words - Array of word objects with timestamps
 * @returns {Array} Array of caption blocks
 */
export function createCaptionBlocksFromWords(words) {
  const blocks = [];
  let currentBlock = [];
  
  // Configuration
  const IDEAL_DURATION = 1.2;      // Optimal caption duration (المدة المثالية)
  const MIN_DURATION = 0.6;        // Minimum duration (الحد الأدنى)
  const MAX_DURATION = 2.0;        // Maximum duration (الحد الأقصى)
  const MIN_WORDS = 1;             // Minimum words per caption
  const MAX_WORDS = 5;             // Maximum words per caption (زيادة من 4 إلى 5)
  const PAUSE_THRESHOLD = 0.15;    // 150ms = natural pause (وقفة طبيعية)
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];
    
    currentBlock.push(word);
    
    const blockDuration = currentBlock[currentBlock.length - 1].end - currentBlock[0].start;
    const pauseAfter = nextWord ? (nextWord.start - word.end) : 0;
    const isLastWord = !nextWord;
    
    // Multi-dimensional analysis
    const hasPunctuation = /[.,!?;:،؛]$/.test(word.word);
    const hasNaturalPause = pauseAfter >= PAUSE_THRESHOLD;
    const isGoodDuration = blockDuration >= MIN_DURATION && blockDuration <= IDEAL_DURATION;
    const hasEnoughWords = currentBlock.length >= 2;
    const isIdealLength = blockDuration >= IDEAL_DURATION && currentBlock.length >= 3;
    
    // Intelligent breaking decision
    const shouldBreak = 
      isLastWord ||  // End of text
      currentBlock.length >= MAX_WORDS ||  // Maximum words reached
      blockDuration >= MAX_DURATION ||  // Too long
      (hasPunctuation && hasNaturalPause && hasEnoughWords) ||  // Punctuation + pause
      (hasNaturalPause && isGoodDuration && hasEnoughWords) ||  // Natural pause + good duration
      isIdealLength;  // Ideal duration reached
    
    if (shouldBreak) {
      blocks.push(createBlock(currentBlock, blocks.length));
      currentBlock = [];
    }
  }
  
  return blocks;
}

/**
 * Helper function to create a caption block
 * @param {Array} words - Array of word objects
 * @param {number} index - Block index
 * @returns {Object} Caption block
 */
function createBlock(words, index) {
  return {
    index,
    text: words.map(w => w.word).join(' '),
    startTime: words[0].start,
    endTime: words[words.length - 1].end,
    words: words.map(w => ({
      w: w.word,
      s: w.start,
      e: w.end
    }))
  };
}
