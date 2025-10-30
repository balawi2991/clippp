/**
 * Generate Service - Handles video generation logic
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { splitScriptIntoScenes, splitIntoCaptionBlocks } from '../utils/scriptSplitter.js';
import { updateJobProgress, completeJob, addJobLog } from './jobService.js';
import { generateSpeech, concatenateAudio, generateSpeechForScenes } from './ttsService.js';
import { fetchImagesForScenes } from './imageService.js';
import { transcribeMultipleAudios, createCaptionBlocksFromWords } from './whisperService.js';

const prisma = new PrismaClient();

/**
 * Process generation job
 * @param {string} jobId - Job ID
 */
export async function processGeneration(jobId) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: { project: true }
  });

  if (!job) throw new Error('Job not found');

  const project = job.project;
  const settings = JSON.parse(project.settingsJson);
  const storagePath = process.env.STORAGE_PATH || './storage';
  const projectPath = path.join(storagePath, project.id);

  try {
    // Step 1: Voice generation (0-25%)
    await addJobLog(jobId, 'info', 'Starting voice generation...');
    await updateJobProgress(jobId, 10, 0);
    
    // Read script
    const scriptPath = path.join(projectPath, 'inputs', 'script.txt');
    const script = fs.readFileSync(scriptPath, 'utf-8');

    // Split script first to get scenes
    const scenes = splitScriptIntoScenes(script, settings.targetLength || 30);
    
    // Generate TTS audio
    const audioDir = path.join(projectPath, 'audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    try {
      // Generate audio for all scenes
      const audioFiles = await generateSpeechForScenes(scenes, audioDir, {
        voice: settings.voice || 'alloy'
      });

      // Concatenate all audio files
      const finalAudioPath = path.join(audioDir, 'tts.mp3');
      if (audioFiles.length > 0) {
        const validFiles = audioFiles.filter(f => f !== null);
        if (validFiles.length > 0) {
          await concatenateAudio(validFiles, finalAudioPath);
          await addJobLog(jobId, 'info', 'Voice generation completed');
        } else {
          await addJobLog(jobId, 'warn', 'No valid audio files generated');
        }
      } else {
        await addJobLog(jobId, 'warn', 'No audio files to process');
      }
    } catch (error) {
      console.error('TTS error:', error);
      await addJobLog(jobId, 'warn', 'Voice generation failed, continuing without audio');
    }

    await updateJobProgress(jobId, 25, 0);

    // Step 2: Images generation (25-50%)
    await addJobLog(jobId, 'info', 'Generating scenes and images...');
    await updateJobProgress(jobId, 30, 1);

    await addJobLog(jobId, 'info', `Created ${scenes.length} scenes`);

    // Fetch images for scenes
    const imagesDir = path.join(projectPath, 'inputs');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    try {
      const images = await fetchImagesForScenes(scenes, imagesDir);
      await addJobLog(jobId, 'info', `Fetched ${images.length} images`);

      // Save scenes to database with image paths
      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i];
        await prisma.scene.create({
          data: {
            projectId: project.id,
            index: scene.index,
            text: scene.text,
            duration: scene.duration,
            startTime: scene.startTime,
            endTime: scene.endTime,
            imagePrompt: scene.imagePrompt,
            imagePath: images[i] || null
          }
        });
      }
    } catch (error) {
      console.error('Image generation error:', error);
      await addJobLog(jobId, 'warn', 'Image generation failed, using placeholders');
      
      // Save scenes without images
      for (const scene of scenes) {
        await prisma.scene.create({
          data: {
            projectId: project.id,
            index: scene.index,
            text: scene.text,
            duration: scene.duration,
            startTime: scene.startTime,
            endTime: scene.endTime,
            imagePrompt: scene.imagePrompt,
            imagePath: null
          }
        });
      }
    }

    await updateJobProgress(jobId, 50, 1);

    // Step 3: Subtitle integration with Whisper (50-75%)
    await addJobLog(jobId, 'info', 'Generating captions with accurate timestamps...');
    await updateJobProgress(jobId, 55, 2);

    const allCaptions = [];
    let captionIndex = 0;

    // Try to use Whisper for accurate timestamps
    const audioFiles = scenes.map((_, i) => path.join(audioDir, `scene_${i}.wav`));
    const validAudioFiles = audioFiles.filter(f => fs.existsSync(f));

    let captionBlocks = [];

    if (validAudioFiles.length > 0) {
      try {
        await addJobLog(jobId, 'info', 'Transcribing audio for accurate word timestamps...');
        
        // Transcribe all audio files and get word-level timestamps
        const transcription = await transcribeMultipleAudios(validAudioFiles);
        
        if (transcription && transcription.words && transcription.words.length > 0) {
          await addJobLog(jobId, 'info', `Whisper transcription: ${transcription.words.length} words, ${transcription.duration.toFixed(2)}s`);
          
          // Create caption blocks from actual word timestamps (2 words per block)
          captionBlocks = createCaptionBlocksFromWords(transcription.words, 2);
          
          await addJobLog(jobId, 'info', `Created ${captionBlocks.length} caption blocks with accurate timestamps`);
        } else {
          throw new Error('No word timestamps from Whisper');
        }
      } catch (error) {
        console.error('Whisper transcription error:', error);
        await addJobLog(jobId, 'warn', 'Whisper failed, using estimated timestamps');
        
        // Fallback to estimated timestamps
        for (const scene of scenes) {
          const blocks = splitIntoCaptionBlocks(scene.text, scene.startTime, scene.duration);
          captionBlocks.push(...blocks);
        }
      }
    } else {
      // No audio files, use estimated timestamps
      await addJobLog(jobId, 'warn', 'No audio files found, using estimated timestamps');
      for (const scene of scenes) {
        const blocks = splitIntoCaptionBlocks(scene.text, scene.startTime, scene.duration);
        captionBlocks.push(...blocks);
      }
    }

    // Save caption blocks to database
    for (const block of captionBlocks) {
      const caption = await prisma.caption.create({
        data: {
          projectId: project.id,
          index: captionIndex++,
          text: block.text,
          startTime: block.startTime,
          endTime: block.endTime,
          wordsJson: JSON.stringify(block.words),
          overlayPath: null // Will be generated on export
        }
      });
      allCaptions.push(caption);
    }

    await addJobLog(jobId, 'info', `Saved ${allCaptions.length} caption blocks to database`);
    
    // Save captions to file
    const captionsPath = path.join(projectPath, 'captions', 'blocks.json');
    fs.writeFileSync(
      captionsPath,
      JSON.stringify(allCaptions.map(c => ({
        index: c.index,
        text: c.text,
        startTime: c.startTime,
        endTime: c.endTime,
        words: JSON.parse(c.wordsJson)
      })), null, 2),
      'utf-8'
    );

    await updateJobProgress(jobId, 75, 2);

    // Step 4: Assemble base video (75-95%)
    await addJobLog(jobId, 'info', 'Assembling base video...');
    await updateJobProgress(jobId, 80, 3);

    try {
      const { assembleCompleteVideo } = await import('./ffmpegService.js');
      
      // Get scenes from database
      const dbScenes = await prisma.scene.findMany({
        where: { projectId: project.id },
        orderBy: { index: 'asc' }
      });

      // Prepare base video path
      const baseVideoPath = path.join(projectPath, 'preview', 'base_video.mp4');
      const previewDir = path.dirname(baseVideoPath);
      if (!fs.existsSync(previewDir)) {
        fs.mkdirSync(previewDir, { recursive: true });
      }

      // Assemble video without burned captions (for preview)
      // Note: captions will be overlayed in the player, not burned yet
      await assembleCompleteVideo(
        { 
          scenes: dbScenes, 
          captions: [] // Empty - no burned captions in preview
        },
        baseVideoPath,
        (progress, message) => {
          const adjustedProgress = 80 + (progress / 5); // 80-95%
          updateJobProgress(jobId, adjustedProgress, 3).catch(console.error);
          if (message && !message.includes('captions')) {
            addJobLog(jobId, 'info', message).catch(console.error);
          }
        }
      );

      await addJobLog(jobId, 'info', `Base video created: ${baseVideoPath}`);
      
      // Save as asset
      await prisma.asset.create({
        data: {
          projectId: project.id,
          kind: 'preview',
          path: baseVideoPath,
          filename: 'base_video.mp4',
          mimeType: 'video/mp4'
        }
      });

    } catch (error) {
      console.error('Video assembly error:', error);
      await addJobLog(jobId, 'warn', 'Failed to create base video, will be created on export');
    }

    await updateJobProgress(jobId, 95, 3);

    // Step 5: Finalizing (95-100%)
    await addJobLog(jobId, 'info', 'Finalizing project...');

    // Update project status
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'ready' }
    });

    await addJobLog(jobId, 'info', 'Generation completed successfully!');
    await updateJobProgress(jobId, 100, 3);
    await completeJob(jobId, true);

  } catch (error) {
    console.error('Generation error:', error);
    await addJobLog(jobId, 'error', error.message);
    await completeJob(jobId, false, error.message);
    
    // Update project status
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'error' }
    });
  }
}

/**
 * Simulate delay (for testing)
 * @param {number} ms - Milliseconds to delay
 */
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
