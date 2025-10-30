/**
 * Canvas Renderer - Renders caption overlays as PNG/WebP
 * Matches the style from /edit/ page 1:1
 * 
 * Refactored for better organization and maintainability
 */

import { createCanvas } from '@napi-rs/canvas';
import fs from 'fs';
import path from 'path';
import { renderFullWithBackground, renderFullText } from './renderers/fullTextRenderer.js';
import { renderKaraoke } from './renderers/karaokeRenderer.js';
import { renderSingleWord } from './renderers/wordByWordRenderer.js';

// Video dimensions (9:16 vertical)
const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;

/**
 * Render caption block to PNG/WebP
 * @param {Object} caption - Caption block
 * @param {Object} style - Style snapshot from /edit/
 * @param {string} outputPath - Output file path
 * @param {number} activeWordIndex - Index of active/highlighted word (for karaoke/word-by-word)
 * @returns {Promise<string>} Path to rendered image
 */
export async function renderCaptionOverlay(caption, style, outputPath, activeWordIndex = 0) {
  const canvas = createCanvas(VIDEO_WIDTH, VIDEO_HEIGHT);
  const ctx = canvas.getContext('2d');

  // Clear canvas (transparent)
  ctx.clearRect(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);

  // Parse style
  const {
    fontFamily = 'Inter',
    fontWeight = 900,
    fontSize = 85,
    textColor = '#FFFFFF',
    highlightColor = '#00FF00',
    strokeWidth = 4,
    strokeColor = '#000000',
    shadowBlur = 12,
    shadowColor = 'rgba(0, 0, 0, 0.9)',
    yPercent = 50,
    displayMode = 'karaoke',
    highlightMode = 'word-highlight'
  } = style;

  // Calculate position
  const y = (VIDEO_HEIGHT * yPercent) / 100;

  // Setup font
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Split text into words
  const words = caption.text.split(' ');
  const wordsData = caption.words || [];

  // Common style object
  const commonStyle = {
    fontSize,
    fontWeight,
    fontFamily,
    textColor,
    highlightColor,
    strokeWidth,
    strokeColor,
    shadowBlur,
    shadowColor,
    highlightMode,
    activeWordIndex
  };

  // Render based on display mode
  if (displayMode === 'full' && highlightMode === 'full-background') {
    await renderFullWithBackground(ctx, caption.text, VIDEO_WIDTH / 2, y, commonStyle);
  } else if (displayMode === 'full' && highlightMode === 'none') {
    await renderFullText(ctx, caption.text, VIDEO_WIDTH / 2, y, commonStyle);
  } else if (displayMode === 'karaoke') {
    await renderKaraoke(ctx, words, VIDEO_WIDTH / 2, y, commonStyle);
  } else if (displayMode === 'word-by-word') {
    const currentWord = words[activeWordIndex] || words[0] || caption.text;
    await renderSingleWord(ctx, currentWord, VIDEO_WIDTH / 2, y, commonStyle);
  }

  // Save as WebP (smaller size, better quality)
  const buffer = canvas.toBuffer('image/webp', 95);
  fs.writeFileSync(outputPath, buffer);

  return outputPath;
}

// All rendering functions moved to separate files for better organization

/**
 * Batch render all captions for a project
 * @param {Array} captions - Array of caption blocks
 * @param {Object} style - Style snapshot
 * @param {string} outputDir - Output directory
 * @returns {Promise<Array>} Array of rendered file paths with timing info
 */
export async function batchRenderCaptions(captions, style, outputDir) {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const results = [];
  const { displayMode = 'karaoke' } = style;

  for (const caption of captions) {
    try {
      const words = caption.text.split(' ');
      const wordsData = caption.words || [];
      
      console.log(`\n📦 Caption ${caption.index}:`, {
        text: caption.text,
        wordsCount: words.length,
        hasWordsData: wordsData.length > 0,
        displayMode,
        startTime: caption.startTime,
        endTime: caption.endTime
      });
      
      // For full text modes: render single image
      if (displayMode === 'full') {
        const filename = `block_${caption.index}.webp`;
        const outputPath = path.join(outputDir, filename);
        
        await renderCaptionOverlay(caption, style, outputPath, 0);
        
        results.push({
          captionId: caption.id,
          index: caption.index,
          path: outputPath,
          filename,
          startTime: caption.startTime,
          endTime: caption.endTime,
          wordIndex: null // No word animation
        });
      } 
      // For karaoke/word-by-word: render image per word
      else if (displayMode === 'karaoke' || displayMode === 'word-by-word') {
        console.log(`📝 Caption ${caption.index}: "${caption.text}" (${words.length} words) - Mode: ${displayMode}`);
        
        for (let wordIndex = 0; wordIndex < words.length; wordIndex++) {
          const filename = `block_${caption.index}_word_${wordIndex}.webp`;
          const outputPath = path.join(outputDir, filename);
          
          await renderCaptionOverlay(caption, style, outputPath, wordIndex);
          
          // Calculate word timing
          let wordStartTime, wordEndTime;
          
          if (wordsData && wordsData[wordIndex]) {
            // Use precise timing from Whisper
            wordStartTime = wordsData[wordIndex].s;
            wordEndTime = wordsData[wordIndex].e;
          } else {
            // Fallback: distribute time evenly
            const captionDuration = caption.endTime - caption.startTime;
            const wordDuration = captionDuration / words.length;
            wordStartTime = caption.startTime + (wordIndex * wordDuration);
            wordEndTime = wordStartTime + wordDuration;
          }
          
          console.log(`  ✅ Word ${wordIndex}: "${words[wordIndex]}" → ${wordStartTime.toFixed(2)}s - ${wordEndTime.toFixed(2)}s`);
          
          results.push({
            captionId: caption.id,
            index: caption.index,
            path: outputPath,
            filename,
            startTime: wordStartTime,
            endTime: wordEndTime,
            wordIndex
          });
        }
      }
    } catch (error) {
      console.error(`Failed to render caption ${caption.index}:`, error);
      results.push({
        captionId: caption.id,
        index: caption.index,
        error: error.message
      });
    }
  }

  console.log(`✅ Rendered ${results.filter(r => !r.error).length} overlays`);
  return results;
}
