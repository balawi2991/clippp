/**
 * Test Groq API Key - Multiple Methods
 */

import dotenv from 'dotenv';
import Groq from 'groq-sdk';

dotenv.config();

const apiKey = process.env.GROQ_API_KEY;

console.log('🔑 Testing Groq API Key...\n');
console.log(`API Key: ${apiKey?.substring(0, 15)}...${apiKey?.substring(apiKey.length - 5)}`);
console.log(`Length: ${apiKey?.length} characters\n`);

// Test 1: Chat Completion (to verify API key works)
async function testChatCompletion() {
  console.log('📝 Test 1: Chat Completion (verify API key)...');
  try {
    const groq = new Groq({ apiKey });
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say "API key works!"' }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10
    });
    console.log('✅ Chat works:', response.choices[0].message.content);
    return true;
  } catch (error) {
    console.log('❌ Chat failed:', error.message);
    return false;
  }
}

// Test 2: TTS with correct endpoint
async function testTTS() {
  console.log('\n🎙️ Test 2: TTS API...');
  try {
    const groq = new Groq({ apiKey });
    
    const response = await groq.audio.speech.create({
      model: 'playai-tts',
      voice: 'Fritz-PlayAI',
      input: 'Hello world!',
      response_format: 'wav'
    });

    console.log('✅ TTS response received');
    console.log('Response type:', typeof response);
    console.log('Response:', response);
    
    // Try to get buffer
    if (response.arrayBuffer) {
      const buffer = await response.arrayBuffer();
      console.log('✅ Audio buffer size:', buffer.byteLength, 'bytes');
      return true;
    } else if (response.body) {
      console.log('✅ Response has body stream');
      return true;
    }
    
    return false;
  } catch (error) {
    console.log('❌ TTS failed:', error.message);
    console.log('Error details:', error);
    return false;
  }
}

// Test 3: Direct HTTP request
async function testDirectHTTP() {
  console.log('\n🌐 Test 3: Direct HTTP Request...');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'playai-tts',
        voice: 'Fritz-PlayAI',
        input: 'Testing direct HTTP',
        response_format: 'wav'
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      console.log('✅ Audio received:', buffer.byteLength, 'bytes');
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Error response:', error);
      return false;
    }
  } catch (error) {
    console.log('❌ HTTP request failed:', error.message);
    return false;
  }
}

// Test 4: Check API endpoint availability
async function testEndpoint() {
  console.log('\n🔍 Test 4: Check TTS Endpoint...');
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Available models:', data.data?.length || 0);
      
      // Check for TTS models
      const ttsModels = data.data?.filter(m => m.id.includes('tts') || m.id.includes('playai'));
      if (ttsModels && ttsModels.length > 0) {
        console.log('✅ TTS models found:');
        ttsModels.forEach(m => console.log('  -', m.id));
      } else {
        console.log('⚠️ No TTS models found in list');
      }
      return true;
    } else {
      console.log('❌ Models endpoint failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Endpoint check failed:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('═'.repeat(60));
  
  const test1 = await testChatCompletion();
  const test2 = await testTTS();
  const test3 = await testDirectHTTP();
  const test4 = await testEndpoint();

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Results Summary:');
  console.log('  Chat Completion:', test1 ? '✅' : '❌');
  console.log('  TTS SDK:', test2 ? '✅' : '❌');
  console.log('  TTS HTTP:', test3 ? '✅' : '❌');
  console.log('  Models List:', test4 ? '✅' : '❌');
  console.log('═'.repeat(60));

  if (test1 && !test2 && !test3) {
    console.log('\n💡 Conclusion: API key works but TTS might not be available for your account');
    console.log('   Check: https://console.groq.com/docs/text-to-speech');
  } else if (!test1) {
    console.log('\n💡 Conclusion: API key is invalid or expired');
    console.log('   Get new key: https://console.groq.com/keys');
  } else if (test1 && (test2 || test3)) {
    console.log('\n💡 Conclusion: Everything works! 🎉');
  }
}

runAllTests();
