/**
 * FFmpeg Service - Professional video assembly and processing
 */

import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import fs from 'fs';
import path from 'path';

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * Create video from images with Ken Burns effect
 * @param {Array} images - Array of image paths
 * @param {Array} scenes - Scene data with durations
 * @param {string} outputPath - Output video path
 * @param {Object} options - Video options
 * @returns {Promise<string>} Path to created video
 */
export async function createVideoFromImages(images, scenes, outputPath, options = {}) {
  const {
    width = 1080,
    height = 1920,
    fps = 30,
    videoBitrate = '5000k'
  } = options;

  return new Promise((resolve, reject) => {
    // Create filter complex for Ken Burns effect
    const filterComplex = [];
    const inputs = [];
    
    scenes.forEach((scene, index) => {
      const imagePath = images[index] || images[0]; // Fallback to first image
      const duration = scene.duration;
      
      // Ken Burns effect: slow zoom and pan
      const scale = 1.0 + (0.1 * (index % 2)); // Alternate zoom direction
      const panX = index % 2 === 0 ? 0 : -50; // Alternate pan direction
      
      filterComplex.push(
        `[${index}:v]scale=${width * scale}:${height * scale},` +
        `crop=${width}:${height}:${panX}:0,` +
        `setpts=PTS-STARTPTS,` +
        `fps=${fps}[v${index}]`
      );
      
      inputs.push({ input: imagePath, options: ['-loop', '1', '-t', duration.toString()] });
    });

    // Concatenate all video segments
    const concatFilter = scenes.map((_, i) => `[v${i}]`).join('') + 
                        `concat=n=${scenes.length}:v=1:a=0[outv]`;
    filterComplex.push(concatFilter);

    // Build FFmpeg command
    let command = ffmpeg();
    
    // Add all inputs
    inputs.forEach(({ input, options }) => {
      command = command.input(input).inputOptions(options);
    });

    // Apply filters and output
    command
      .complexFilter(filterComplex)
      .outputOptions([
        '-map', '[outv]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        `-b:v`, videoBitrate
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Video assembly progress: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('Video assembly completed');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Add audio to video
 * @param {string} videoPath - Input video path
 * @param {string} audioPath - Audio file path
 * @param {string} outputPath - Output video path
 * @param {Object} options - Audio options
 * @returns {Promise<string>} Path to video with audio
 */
export async function addAudioToVideo(videoPath, audioPath, outputPath, options = {}) {
  const {
    audioVolume = 1.0,
    fadeIn = 0.3,
    fadeOut = 0.3
  } = options;

  return new Promise((resolve, reject) => {
    // Get video duration first to calculate fade out start time
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoDuration = metadata.format.duration || 0;
      const fadeOutStart = Math.max(0, videoDuration - fadeOut);

      ffmpeg()
        .input(videoPath)
        .input(audioPath)
        .outputOptions([
          '-c:v', 'copy', // Copy video stream (no re-encoding)
          '-c:a', 'aac',
          '-b:a', '192k',
          // Removed -shortest to let video play full duration
          `-filter:a`, `volume=${audioVolume},afade=t=in:st=0:d=${fadeIn},afade=t=out:st=${fadeOutStart}:d=${fadeOut}`
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('Adding audio:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`Audio merge progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          console.log('Audio added successfully');
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('Audio merge error:', err);
          reject(err);
        })
        .run();
    });
  });
}

/**
 * Burn caption overlays onto video
 * @param {string} videoPath - Input video path
 * @param {Array} captions - Caption data with overlay paths
 * @param {string} outputPath - Output video path
 * @returns {Promise<string>} Path to final video
 */
/**
 * Burn caption overlays - OPTIMIZED with batching
 * Groups overlays by time to reduce filter complexity
 */
export async function burnCaptionsToVideo(videoPath, overlays, outputPath) {
  return new Promise((resolve, reject) => {
    // Filter valid overlays (overlays now include word-level timing)
    const validOverlays = overlays.filter(o => o.path && fs.existsSync(o.path) && !o.error);
    
    if (validOverlays.length === 0) {
      console.log('No valid overlays, copying video...');
      fs.copyFileSync(videoPath, outputPath);
      return resolve(outputPath);
    }

    // Strategy: Batch overlays in groups of 10 to reduce filter depth
    const BATCH_SIZE = 10;
    const batches = [];
    
    for (let i = 0; i < validOverlays.length; i += BATCH_SIZE) {
      batches.push(validOverlays.slice(i, i + BATCH_SIZE));
    }

    console.log(`Burning ${validOverlays.length} overlays in ${batches.length} batches...`);

    let command = ffmpeg().input(videoPath);
    
    // Add all overlay images as inputs
    validOverlays.forEach(overlay => {
      command = command.input(overlay.path);
    });

    // Build optimized filter complex
    const filterParts = [];
    let currentStream = '0:v';
    let inputOffset = 1; // Start after video input
    
    batches.forEach((batch, batchIndex) => {
      const isLastBatch = batchIndex === batches.length - 1;
      const outputStream = isLastBatch ? 'out' : `batch${batchIndex}`;
      
      // Process batch sequentially (but batches are smaller)
      let batchStream = currentStream;
      
      batch.forEach((overlay, overlayIndex) => {
        const globalIndex = batchIndex * BATCH_SIZE + overlayIndex;
        const inputIndex = inputOffset + globalIndex;
        const isLastInBatch = overlayIndex === batch.length - 1;
        const nextStream = isLastInBatch ? outputStream : `b${batchIndex}_${overlayIndex}`;
        
        filterParts.push({
          filter: 'overlay',
          options: {
            x: '(W-w)/2',
            y: '(H-h)/2',
            enable: `between(t,${overlay.startTime.toFixed(3)},${overlay.endTime.toFixed(3)})`
          },
          inputs: [batchStream, `${inputIndex}:v`],
          outputs: nextStream
        });
        
        batchStream = nextStream;
      });
      
      currentStream = outputStream;
    });

    command
      .complexFilter(filterParts)
      .outputOptions([
        '-map', '[out]',
        '-map', '0:a?',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'copy',
        '-movflags', '+faststart'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('Starting caption burn...');
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`Caption burn: ${Math.round(progress.percent)}%`);
        }
      })
      .on('end', () => {
        console.log('Captions burned successfully');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('Caption burn error:', err);
        reject(err);
      })
      .run();
  });
}

/**
 * Get video metadata
 * @param {string} videoPath - Video file path
 * @returns {Promise<Object>} Video metadata
 */
export async function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata);
      }
    });
  });
}

/**
 * Create placeholder images for scenes
 * @param {Array} scenes - Scene data
 * @param {string} outputDir - Output directory
 * @returns {Promise<Array>} Array of image paths
 */
export async function createPlaceholderImages(scenes, outputDir) {
  // For now, create simple colored images
  // TODO: Replace with Pexels API or user uploads
  
  const sharp = await import('sharp');
  const images = [];

  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i];
    const imagePath = path.join(outputDir, `scene_${i}.png`);
    
    // Create a gradient background with scene text
    const colors = [
      { r: 59, g: 130, b: 246 },  // Blue
      { r: 139, g: 92, b: 246 },  // Purple
      { r: 236, g: 72, b: 153 },  // Pink
      { r: 251, g: 146, b: 60 },  // Orange
      { r: 34, g: 197, b: 94 }    // Green
    ];
    
    const color = colors[i % colors.length];
    
    // Create solid color image (1080x1920)
    await sharp.default({
      create: {
        width: 1080,
        height: 1920,
        channels: 3,
        background: color
      }
    })
    .png()
    .toFile(imagePath);
    
    images.push(imagePath);
  }

  return images;
}

/**
 * Complete video assembly pipeline
 * @param {Object} project - Project data
 * @param {string} outputPath - Final output path
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<string>} Path to final video
 */
export async function assembleCompleteVideo(project, outputPath, onProgress) {
  const projectPath = path.dirname(path.dirname(outputPath));
  const tempDir = path.join(projectPath, 'temp');
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // Step 1: Get images from scenes (20%)
    onProgress?.(20, 'Preparing images...');
    const imagesDir = path.join(projectPath, 'inputs');
    
    // Use existing images from scenes (from Pexels or uploaded)
    const images = [];
    const missingImages = [];
    
    for (let i = 0; i < project.scenes.length; i++) {
      const scene = project.scenes[i];
      
      // Check if scene has an image path and file exists
      if (scene.imagePath && fs.existsSync(scene.imagePath)) {
        images.push(scene.imagePath);
      } else {
        // Image missing, mark for placeholder creation
        missingImages.push({ scene, index: i });
        images.push(null); // Placeholder
      }
    }
    
    // Create placeholders only for missing images
    if (missingImages.length > 0) {
      console.log(`Creating ${missingImages.length} placeholder images...`);
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      
      const placeholders = await createPlaceholderImages(
        missingImages.map(m => m.scene), 
        imagesDir
      );
      
      // Fill in the placeholders
      missingImages.forEach((missing, idx) => {
        images[missing.index] = placeholders[idx];
      });
    }
    
    console.log(`Using ${images.length} images for video assembly`);

    // Step 2: Create base video from images (40%)
    onProgress?.(40, 'Assembling video...');
    const baseVideoPath = path.join(tempDir, 'base_video.mp4');
    
    // Check if audio exists to match video duration
    const audioPath = path.join(projectPath, 'audio', 'tts.mp3');
    let videoDuration = project.scenes.reduce((sum, scene) => sum + scene.duration, 0);
    
    if (fs.existsSync(audioPath)) {
      // Get actual audio duration
      const audioMetadata = await new Promise((resolve, reject) => {
        ffmpeg.ffprobe(audioPath, (err, metadata) => {
          if (err) reject(err);
          else resolve(metadata);
        });
      });
      
      const audioDuration = audioMetadata.format.duration;
      console.log(`Audio duration: ${audioDuration.toFixed(2)}s, Scene duration: ${videoDuration.toFixed(2)}s`);
      
      // Use audio duration if longer (audio determines video length)
      if (audioDuration > videoDuration) {
        console.log(`Extending video to match audio duration: ${audioDuration.toFixed(2)}s`);
        videoDuration = audioDuration;
        
        // Adjust scene durations proportionally
        const ratio = audioDuration / project.scenes.reduce((sum, scene) => sum + scene.duration, 0);
        project.scenes.forEach(scene => {
          scene.duration *= ratio;
        });
      }
    }
    
    await createVideoFromImages(images, project.scenes, baseVideoPath);

    // Step 3: Add audio if exists (60%)
    let videoWithAudio = baseVideoPath;
    // audioPath already defined above
    if (fs.existsSync(audioPath)) {
      onProgress?.(60, 'Adding audio...');
      videoWithAudio = path.join(tempDir, 'video_with_audio.mp4');
      await addAudioToVideo(baseVideoPath, audioPath, videoWithAudio);
    }

    // Step 4: Finalize video (80%)
    if (project.captions && project.captions.length > 0) {
      onProgress?.(80, 'Finalizing video...');
      await burnCaptionsToVideo(videoWithAudio, project.captions, outputPath);
    } else {
      // No captions, just copy the video
      onProgress?.(80, 'Finalizing video...');
      fs.copyFileSync(videoWithAudio, outputPath);
    }

    // Step 5: Complete (100%)
    onProgress?.(100, 'Complete!');
    
    // Verify output file exists
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file not created: ${outputPath}`);
    }
    
    console.log(`Video assembly complete: ${outputPath} (${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB)`);

    // Cleanup temp files
    try {
      if (fs.existsSync(baseVideoPath)) fs.unlinkSync(baseVideoPath);
      if (videoWithAudio !== baseVideoPath && fs.existsSync(videoWithAudio)) {
        fs.unlinkSync(videoWithAudio);
      }
    } catch (cleanupError) {
      console.warn('Cleanup error:', cleanupError);
    }

    return outputPath;
  } catch (error) {
    console.error('Video assembly error:', error);
    throw error;
  }
}
