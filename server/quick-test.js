// Quick test for generation flow
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function test() {
  console.log('🧪 Testing generation flow...\n');

  // 1. Get random script
  console.log('1. Getting random script...');
  const scriptRes = await fetch(`${API_URL}/scripts/random`);
  const { script } = await scriptRes.json();
  console.log(`   Script: ${script.substring(0, 50)}...\n`);

  // 2. Create project
  console.log('2. Creating project...');
  const projectRes = await fetch(`${API_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Test Video',
      script: script
    })
  });
  const project = await projectRes.json();
  console.log(`   Project ID: ${project.id}\n`);

  // 3. Start generation
  console.log('3. Starting generation...');
  const genRes = await fetch(`${API_URL}/projects/${project.id}/generate`, {
    method: 'POST'
  });
  const { jobId } = await genRes.json();
  console.log(`   Job ID: ${jobId}\n`);

  // 4. Poll job
  console.log('4. Polling job progress...');
  let completed = false;
  while (!completed) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobRes = await fetch(`${API_URL}/jobs/${jobId}`);
    const job = await jobRes.json();
    
    console.log(`   Progress: ${job.progress}% | Step: ${job.currentStep} | Status: ${job.status}`);
    
    if (job.status === 'completed') {
      completed = true;
      console.log('\n✅ Generation completed!');
    } else if (job.status === 'failed') {
      console.log('\n❌ Generation failed:', job.errorText);
      break;
    }
  }

  // 5. Get project details
  console.log('\n5. Getting project details...');
  const finalRes = await fetch(`${API_URL}/projects/${project.id}`);
  const finalProject = await finalRes.json();
  console.log(`   Scenes: ${finalProject.scenes?.length || 0}`);
  console.log(`   Captions: ${finalProject.captions?.length || 0}`);
  console.log(`   Status: ${finalProject.status}`);

  console.log('\n🎉 Test complete!');
}

test().catch(console.error);
