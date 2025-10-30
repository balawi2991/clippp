/**
 * Export Service - Handles video export with caption burn-in
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { batchRenderCaptions } from '../utils/canvasRenderer.js';
import { assembleCompleteVideo } from './ffmpegService.js';
import { updateJobProgress, completeJob, addJobLog } from './jobService.js';

const prisma = new PrismaClient();

/**
 * Process export job
 * @param {string} jobId - Job ID
 */
export async function processExport(jobId) {
  console.log('🚀 [EXPORT v2.0] Starting export with word-level animation support...');
  
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      project: {
        include: {
          captions: { orderBy: { index: 'asc' } },
          scenes: { orderBy: { index: 'asc' } }
        }
      }
    }
  });

  if (!job) throw new Error('Job not found');

  const project = job.project;
  const styleJson = JSON.parse(project.styleJson);
  
  console.log('📋 Style JSON:', JSON.stringify(styleJson, null, 2));
  
  // Load theme definitions
  const PRESET_THEMES = {
    HORMOZI: {
      name: "HORMOZI",
      fontFamily: "Inter",
      fontWeight: 900,
      textColor: "#FFFFFF",
      highlightColor: "#00FF00",
      fontSize: 85,
      strokeWidth: 4,
      strokeColor: "#000000",
      shadowBlur: 12,
      shadowColor: "rgba(0, 0, 0, 0.9)",
      displayMode: "karaoke",
      highlightMode: "word-highlight",
    },
    BEAST: {
      name: "BEAST",
      fontFamily: "Inter",
      fontWeight: 900,
      textColor: "#000000",
      highlightColor: "#FFD700",
      fontSize: 90,
      strokeWidth: 0,
      strokeColor: "#000000",
      shadowBlur: 15,
      shadowColor: "rgba(255, 215, 0, 0.6)",
      displayMode: "full",
      highlightMode: "full-background",
    },
    VIRAL: {
      name: "VIRAL",
      fontFamily: "Inter",
      fontWeight: 900,
      textColor: "#FFEB3B",
      highlightColor: "#000000",
      fontSize: 82,
      strokeWidth: 5,
      strokeColor: "#000000",
      shadowBlur: 10,
      shadowColor: "rgba(0, 0, 0, 0.8)",
      displayMode: "word-by-word",
      highlightMode: "stroke-only",
    },
    MINIMAL: {
      name: "MINIMAL",
      fontFamily: "Inter",
      fontWeight: 800,
      textColor: "#FFFFFF",
      highlightColor: "rgba(0, 0, 0, 0.75)",
      fontSize: 75,
      strokeWidth: 2,
      strokeColor: "#000000",
      shadowBlur: 8,
      shadowColor: "rgba(0, 0, 0, 0.9)",
      displayMode: "full",
      highlightMode: "none",
    },
    NEON: {
      name: "NEON",
      fontFamily: "Inter",
      fontWeight: 900,
      textColor: "#00FFFF",
      highlightColor: "#FF006E",
      fontSize: 88,
      strokeWidth: 3,
      strokeColor: "#000000",
      shadowBlur: 20,
      shadowColor: "rgba(0, 255, 255, 0.7)",
      displayMode: "karaoke",
      highlightMode: "full-background",
    },
  };
  
  // Prepare style for canvas renderer
  // Support both old format (flat) and new format (theme + overrides)
  let style;
  if (styleJson.theme && styleJson.overrides) {
    // New format - get theme base and apply overrides
    const themeBase = PRESET_THEMES[styleJson.theme] || PRESET_THEMES.HORMOZI;
    style = {
      ...themeBase, // Include all theme properties (displayMode, highlightMode, etc.)
      fontSize: styleJson.overrides.fontSize || themeBase.fontSize,
      textColor: styleJson.overrides.textColor || themeBase.textColor,
      highlightColor: styleJson.overrides.highlightColor || themeBase.highlightColor,
      yPercent: styleJson.overrides.yPercent || 50,
    };
    console.log('✅ Using new format style:', { 
      theme: styleJson.theme,
      displayMode: style.displayMode,
      highlightMode: style.highlightMode,
      fontSize: style.fontSize, 
      yPercent: style.yPercent 
    });
  } else {
    // Old format - use as is
    style = styleJson;
    console.log('✅ Using old format style:', { 
      displayMode: style.displayMode,
      fontSize: style.fontSize, 
      yPercent: style.yPercent 
    });
  }
  
  const storagePath = process.env.STORAGE_PATH || './storage';
  const projectPath = path.join(storagePath, project.id);
  const overlaysPath = path.join(projectPath, 'overlays');

  try {
    // Step 1: Render caption overlays (0-50%)
    await addJobLog(jobId, 'info', 'Rendering caption overlays...');
    await updateJobProgress(jobId, 10, 0);

    // Parse captions with words
    const captions = project.captions.map(cap => ({
      ...cap,
      words: cap.wordsJson ? JSON.parse(cap.wordsJson) : null
    }));

    await addJobLog(jobId, 'info', `Rendering ${captions.length} caption overlays...`);

    // Batch render all captions (now returns overlays with word-level timing)
    const renderedOverlays = await batchRenderCaptions(captions, style, overlaysPath);
    
    const successCount = renderedOverlays.filter(r => !r.error).length;
    await addJobLog(jobId, 'info', `Rendered ${successCount} overlays`);
    await updateJobProgress(jobId, 50, 0);

    // Step 2: Burn captions to existing preview video (50-100%)
    await addJobLog(jobId, 'info', 'Burning captions to video...');
    
    const exportPath = path.join(projectPath, 'exports', 'final.mp4');
    const exportsDir = path.dirname(exportPath);
    
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Use existing preview video (don't recreate from scratch!)
    const previewPath = path.join(projectPath, 'preview', 'base_video.mp4');
    
    if (!fs.existsSync(previewPath)) {
      throw new Error('Preview video not found. Please generate the video first.');
    }

    await addJobLog(jobId, 'info', 'Using existing preview video...');
    await updateJobProgress(jobId, 60, 1);

    // Burn overlays to preview video (overlays now include word-level timing)
    const { burnCaptionsToVideo } = await import('./ffmpegService.js');
    
    await burnCaptionsToVideo(previewPath, renderedOverlays, exportPath);
    
    await updateJobProgress(jobId, 90, 1);

    await addJobLog(jobId, 'info', `Video exported: ${exportPath}`);

    // Save export asset
    await prisma.asset.create({
      data: {
        projectId: project.id,
        kind: 'export',
        path: exportPath,
        filename: 'final.mp4',
        mimeType: 'video/mp4'
      }
    });

    await addJobLog(jobId, 'info', 'Export completed!');
    await updateJobProgress(jobId, 100, 1);

    // Update project status
    await prisma.project.update({
      where: { id: project.id },
      data: { status: 'exported' }
    });

    await completeJob(jobId, true);

  } catch (error) {
    console.error('Export error:', error);
    await addJobLog(jobId, 'error', error.message);
    await completeJob(jobId, false, error.message);
  }
}

/**
 * Simulate delay (for testing)
 * @param {number} ms - Milliseconds to delay
 */
function simulateDelay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
