// Quick test for export flow
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3001/api';

async function testExport() {
  console.log('🧪 Testing export flow...\n');

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
      title: 'Export Test Video',
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
  const { jobId: genJobId } = await genRes.json();
  console.log(`   Generation Job ID: ${genJobId}\n`);

  // 4. Wait for generation to complete
  console.log('4. Waiting for generation...');
  let genCompleted = false;
  while (!genCompleted) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const jobRes = await fetch(`${API_URL}/jobs/${genJobId}`);
    const job = await jobRes.json();
    
    console.log(`   Progress: ${job.progress}% | Step: ${job.currentStep}`);
    
    if (job.status === 'completed') {
      genCompleted = true;
      console.log('   ✅ Generation completed!\n');
    } else if (job.status === 'failed') {
      console.log('   ❌ Generation failed:', job.errorText);
      return;
    }
  }

  // 5. Start export
  console.log('5. Starting export...');
  const exportRes = await fetch(`${API_URL}/projects/${project.id}/export`, {
    method: 'POST'
  });
  const { jobId: exportJobId } = await exportRes.json();
  console.log(`   Export Job ID: ${exportJobId}\n`);

  // 6. Wait for export to complete
  console.log('6. Waiting for export...');
  let exportCompleted = false;
  while (!exportCompleted) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const jobRes = await fetch(`${API_URL}/jobs/${exportJobId}`);
    const job = await jobRes.json();
    
    console.log(`   Progress: ${job.progress}% | Step: ${job.currentStep}`);
    
    if (job.logs && job.logs.length > 0) {
      const lastLog = job.logs[job.logs.length - 1];
      console.log(`   Log: ${lastLog.message}`);
    }
    
    if (job.status === 'completed') {
      exportCompleted = true;
      console.log('\n   ✅ Export completed!\n');
    } else if (job.status === 'failed') {
      console.log('\n   ❌ Export failed:', job.errorText);
      if (job.logs) {
        console.log('\n   Logs:');
        job.logs.forEach(log => console.log(`     ${log.level}: ${log.message}`));
      }
      return;
    }
  }

  // 7. Check final video
  console.log('7. Checking final video...');
  const finalRes = await fetch(`${API_URL}/projects/${project.id}`);
  const finalProject = await finalRes.json();
  
  const exportAsset = finalProject.assets?.find(a => a.kind === 'export');
  if (exportAsset) {
    console.log(`   ✅ Video exported: ${exportAsset.path}`);
    console.log(`   Size: ${(exportAsset.size / 1024 / 1024).toFixed(2)} MB`);
  } else {
    console.log('   ⚠️ No export asset found');
  }

  console.log('\n🎉 Export test complete!');
  console.log(`\nCheck video at: server/storage/${project.id}/exports/final.mp4`);
}

testExport().catch(console.error);
