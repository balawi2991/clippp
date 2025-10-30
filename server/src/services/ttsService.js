/**
 * TTS Service - Text-to-Speech using Groq
 */

import Groq from 'groq-sdk';
import fs from 'fs';
import path from 'path';
import { mapVoiceToGroq } from '../utils/voiceMapper.js';

// Initialize Groq client lazily to ensure env vars are loaded
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
 * Generate speech from text using Groq TTS
 * @param {string} text - Text to convert to speech
 * @param {string} outputPath - Output audio file path
 * @param {Object} options - TTS options
 * @returns {Promise<string>} Path to generated audio file
 */
export async function generateSpeech(text, outputPath, options = {}) {
  const {
    voice: rawVoice = process.env.TTS_VOICE || 'Fritz-PlayAI',
    speed = 1.0,
    model = process.env.TTS_MODEL || 'playai-tts' // playai-tts (English) or playai-tts-arabic
  } = options;
  
  // Map UI voice name to Groq voice ID
  const voice = mapVoiceToGroq(rawVoice);

  try {
    // Check if Groq TTS is enabled
    if (process.env.USE_GROQ_TTS !== 'true' || !process.env.GROQ_API_KEY) {
      console.log('Groq TTS disabled, creating placeholder audio...');
      return createPlaceholderAudio(outputPath, text);
    }

    console.log(`Generating speech with Groq TTS (${voice})...`);
    
    // Generate speech using Groq TTS API
    const client = getGroqClient();
    const response = await client.audio.speech.create({
      model: model,
      voice: voice,
      input: text,
      response_format: 'wav'
    });

    // Get audio buffer and write to file
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`Speech generated successfully: ${outputPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
    return outputPath;
    
  } catch (error) {
    console.error('Groq TTS error:', error);
    console.log('Falling back to placeholder audio...');
    return createPlaceholderAudio(outputPath, text);
  }
}

/**
 * Create placeholder audio file (silence)
 * @param {string} outputPath - Output path
 * @param {string} text - Text (for duration calculation)
 * @returns {Promise<string>} Path to audio file
 */
async function createPlaceholderAudio(outputPath, text) {
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  const ffmpegInstaller = (await import('@ffmpeg-installer/ffmpeg')).default;
  
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);

  // Calculate duration based on text length (2.5 words per second)
  const wordCount = text.split(/\s+/).length;
  const duration = wordCount / 2.5;

  return new Promise((resolve, reject) => {
    // Generate silence audio
    ffmpeg()
      .input('anullsrc=r=44100:cl=stereo')
      .inputFormat('lavfi')
      .duration(duration)
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .output(outputPath)
      .on('end', () => {
        console.log(`Placeholder audio created: ${duration.toFixed(1)}s`);
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Placeholder audio error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Generate speech for multiple scenes
 * @param {Array} scenes - Array of scene objects with text
 * @param {string} outputDir - Output directory
 * @param {Object} options - TTS options
 * @returns {Promise<Array>} Array of audio file paths
 */
export async function generateSpeechForScenes(scenes, outputDir, options = {}) {
  const audioFiles = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const audioPath = path.join(outputDir, `scene_${i}.wav`); // Changed to .wav for Groq TTS
    
    try {
      await generateSpeech(scene.text, audioPath, options);
      audioFiles.push(audioPath);
    } catch (error) {
      console.error(`Failed to generate audio for scene ${i}:`, error);
      audioFiles.push(null);
    }
  }

  return audioFiles;
}

/**
 * Concatenate multiple audio files
 * @param {Array} audioFiles - Array of audio file paths
 * @param {string} outputPath - Output path for concatenated audio
 * @returns {Promise<string>} Path to concatenated audio
 */
export async function concatenateAudio(audioFiles, outputPath) {
  const ffmpeg = (await import('fluent-ffmpeg')).default;
  const ffmpegInstaller = (await import('@ffmpeg-installer/ffmpeg')).default;
  
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);

  // Filter out null files
  const validFiles = audioFiles.filter(f => f && fs.existsSync(f));

  if (validFiles.length === 0) {
    throw new Error('No valid audio files to concatenate');
  }

  if (validFiles.length === 1) {
    // Convert single WAV to MP3
    console.log(`Converting audio: ${validFiles[0]} → ${outputPath}`);
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(validFiles[0])
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .output(outputPath)
        .on('end', () => {
          console.log('Audio converted successfully');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Audio conversion error:', err);
          reject(err);
        })
        .run();
    });
  }

  // Multiple files: concatenate then convert
  console.log(`Concatenating ${validFiles.length} audio files...`);
  return new Promise((resolve, reject) => {
    let command = ffmpeg();

    // Add all inputs
    validFiles.forEach(file => {
      command = command.input(file);
    });

    // Concatenate and convert to mp3
    command
      .audioCodec('libmp3lame')
      .audioBitrate('192k')
      .on('end', () => {
        console.log('Audio files concatenated and converted');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Audio concatenation error:', err);
        reject(err);
      })
      .mergeToFile(outputPath);
  });
}
