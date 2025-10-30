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
 * Create smart caption blocks with dynamic word count (1-4 words)
 * @param {Array} words - Array of word objects with timestamps
 * @returns {Array} Array of caption blocks
 */
export function createCaptionBlocksFromWords(words) {
  const blocks = [];
  let currentBlock = [];
  
  const TARGET_DURATION = 1.2; // 1.2 seconds per caption
  const MIN_DURATION = 0.8;
  const MAX_DURATION = 1.8;
  const MAX_WORDS = 4;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    currentBlock.push(word);
    
    const blockDuration = currentBlock[currentBlock.length - 1].end - currentBlock[0].start;
    const isLastWord = i === words.length - 1;
    
    // Decide if we should break the caption
    const shouldBreak = 
      isLastWord ||  // Last word
      currentBlock.length >= MAX_WORDS ||  // Max 4 words
      blockDuration >= MAX_DURATION ||  // Max 1.8s
      (blockDuration >= MIN_DURATION && currentBlock.length >= 2);  // Good enough
    
    if (shouldBreak) {
      blocks.push({
        index: blocks.length,
        text: currentBlock.map(w => w.word).join(' '),
        startTime: currentBlock[0].start,
        endTime: currentBlock[currentBlock.length - 1].end,
        words: currentBlock.map(w => ({
          w: w.word,
          s: w.start,
          e: w.end
        }))
      });
      currentBlock = [];
    }
  }
  
  return blocks;
}
