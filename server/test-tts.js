/**
 * Test Groq TTS Integration
 * Run: node test-tts.js
 */

import dotenv from 'dotenv';
import { generateSpeech } from './src/services/ttsService.js';
import path from 'path';
import fs from 'fs';

dotenv.config();

async function testTTS() {
  console.log('🎙️ Testing Groq TTS...\n');

  // Check if TTS is enabled
  if (process.env.USE_GROQ_TTS !== 'true') {
    console.log('❌ TTS is disabled. Set USE_GROQ_TTS=true in .env');
    return;
  }

  if (!process.env.GROQ_API_KEY) {
    console.log('❌ GROQ_API_KEY not found in .env');
    return;
  }

  console.log('✅ TTS enabled');
  console.log(`✅ API Key: ${process.env.GROQ_API_KEY.substring(0, 10)}...`);
  console.log(`✅ Model: ${process.env.TTS_MODEL || 'playai-tts'}`);
  console.log(`✅ Voice: ${process.env.TTS_VOICE || 'Fritz-PlayAI'}\n`);

  // Create test directory
  const testDir = './test-audio';
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Test text
  const testText = "Success is not final. Failure is not fatal. It is the courage to continue that counts.";
  const outputPath = path.join(testDir, 'test-speech.wav');

  console.log('📝 Test text:', testText);
  console.log('📁 Output path:', outputPath);
  console.log('\n⏳ Generating speech...\n');

  try {
    const startTime = Date.now();
    await generateSpeech(testText, outputPath);
    const duration = Date.now() - startTime;

    console.log(`\n✅ Speech generated successfully in ${duration}ms!`);
    console.log(`📁 File saved: ${outputPath}`);
    
    // Check file size
    const stats = fs.statSync(outputPath);
    console.log(`📊 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🎉 Test completed successfully!');
    console.log('🔊 Play the audio file to verify quality.');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  }
}

testTTS();
