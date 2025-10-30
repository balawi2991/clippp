/**
 * Test Groq Whisper API with word-level timestamps
 */

import Groq from 'groq-sdk';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

async function testWhisper() {
  try {
    console.log('🎤 Testing Groq Whisper API...\n');
    
    // Find a test audio file
    const testAudioPath = './storage/fec031ca-fc6c-4b71-8676-3b1907f067cd/audio/scene_0.wav';
    
    if (!fs.existsSync(testAudioPath)) {
      console.error('❌ Test audio file not found:', testAudioPath);
      console.log('Please generate a video first to create audio files.');
      return;
    }
    
    console.log('📁 Audio file:', testAudioPath);
    console.log('📊 File size:', (fs.statSync(testAudioPath).size / 1024).toFixed(2), 'KB\n');
    
    // Test transcription with word timestamps
    console.log('🔄 Transcribing with word-level timestamps...\n');
    
    const audioFile = fs.createReadStream(testAudioPath);
    
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "verbose_json",
      timestamp_granularities: ["word"]
    });
    
    console.log('✅ Transcription successful!\n');
    console.log('📝 Text:', transcription.text);
    console.log('⏱️  Duration:', transcription.duration?.toFixed(2), 'seconds');
    console.log('🔤 Words:', transcription.words?.length || 0, '\n');
    
    if (transcription.words && transcription.words.length > 0) {
      console.log('📋 Word timestamps (first 10):');
      transcription.words.slice(0, 10).forEach((w, i) => {
        console.log(`  ${i + 1}. "${w.word}" → ${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s`);
      });
      
      console.log('\n✅ Word-level timestamps are supported!');
      console.log('✅ Groq Whisper API is working correctly!');
    } else {
      console.log('⚠️  No word timestamps received');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testWhisper();
