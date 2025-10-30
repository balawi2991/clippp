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
 * Create caption blocks from word timestamps (2 words per block)
 * @param {Array} words - Array of word objects with timestamps
 * @param {number} wordsPerBlock - Words per caption block (default: 2)
 * @returns {Array} Array of caption blocks
 */
export function createCaptionBlocksFromWords(words, wordsPerBlock = 2) {
  const blocks = [];
  
  for (let i = 0; i < words.length; i += wordsPerBlock) {
    const blockWords = words.slice(i, i + wordsPerBlock);
    
    if (blockWords.length === 0) continue;
    
    const blockText = blockWords.map(w => w.word).join(' ');
    const startTime = blockWords[0].start;
    const endTime = blockWords[blockWords.length - 1].end;
    
    blocks.push({
      index: blocks.length,
      text: blockText,
      startTime,
      endTime,
      words: blockWords.map(w => ({
        w: w.word,
        s: w.start,
        e: w.end
      }))
    });
  }
  
  return blocks;
}
