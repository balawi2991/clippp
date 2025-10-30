/**
 * Karaoke Renderer
 * Renders all words with specific word highlighted
 */

import { CAPTION_STYLES, getMaxTextWidth } from '../../constants/captionStyles.js';
import { drawTextWithEffects, roundRect } from './shared/textEffects.js';

const VIDEO_WIDTH = 1080;

/**
 * Render karaoke mode (all words, specific word highlighted) with word wrapping
 */
export async function renderKaraoke(ctx, words, centerX, y, style) {
  const {
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
    activeWordIndex = 0
  } = style;

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

  // Calculate word metrics
  const wordMetrics = words.map(word => ({
    word,
    width: ctx.measureText(word).width
  }));

  const gap = CAPTION_STYLES.KARAOKE.GAP;
  const maxWidth = getMaxTextWidth(VIDEO_WIDTH);
  const lineHeight = fontSize * 1.5;
  
  // Split words into lines (word wrapping)
  const lines = [];
  let currentLine = [];
  let currentLineWidth = 0;
  
  for (let i = 0; i < wordMetrics.length; i++) {
    const { word, width } = wordMetrics[i];
    const wordWithGap = currentLine.length > 0 ? width + gap : width;
    
    if (currentLineWidth + wordWithGap > maxWidth && currentLine.length > 0) {
      // Doesn't fit → start new line
      lines.push(currentLine);
      currentLine = [{ ...wordMetrics[i], index: i }];
      currentLineWidth = width;
    } else {
      // Fits → add to current line
      currentLine.push({ ...wordMetrics[i], index: i });
      currentLineWidth += wordWithGap;
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  // Calculate starting position (vertical centering)
  const totalHeight = lines.length * lineHeight;
  let currentY = y - (totalHeight / 2) + (lineHeight / 2);
  
  // Draw each line
  for (const line of lines) {
    const lineWidth = line.reduce((sum, w, i) => sum + w.width + (i > 0 ? gap : 0), 0);
    let currentX = centerX - lineWidth / 2;
    
    // Draw each word in line
    for (const { word, width, index } of line) {
      const isHighlighted = index === activeWordIndex;
      const wordX = currentX + width / 2;

      if (highlightMode === 'word-highlight' && isHighlighted) {
        // Draw background for highlighted word
        const { horizontal: paddingH, vertical: paddingV } = CAPTION_STYLES.KARAOKE.WORD_HIGHLIGHT.PADDING;
        const radius = CAPTION_STYLES.KARAOKE.WORD_HIGHLIGHT.BORDER_RADIUS;
        
        const bgX = currentX - paddingH;
        const bgY = currentY - fontSize / 2 - paddingV;
        const bgWidth = width + paddingH * 2;
        const bgHeight = fontSize + paddingV * 2;

        ctx.fillStyle = highlightColor;
        roundRect(ctx, bgX, bgY, bgWidth, bgHeight, radius);
        ctx.fill();
      } else if (highlightMode === 'full-background') {
        // All words have background, highlighted one is brighter
        const { horizontal: paddingH, vertical: paddingV } = CAPTION_STYLES.KARAOKE.FULL_BACKGROUND.PADDING;
        const radius = CAPTION_STYLES.KARAOKE.FULL_BACKGROUND.BORDER_RADIUS;
        
        const bgX = currentX - paddingH;
        const bgY = currentY - fontSize / 2 - paddingV;
        const bgWidth = width + paddingH * 2;
        const bgHeight = fontSize + paddingV * 2;

        ctx.fillStyle = highlightColor;
        ctx.globalAlpha = isHighlighted ? 1.0 : 0.5;
        roundRect(ctx, bgX, bgY, bgWidth, bgHeight, radius);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // Draw word
      drawTextWithEffects(ctx, word, wordX, currentY, {
        textColor,
        strokeWidth,
        strokeColor,
        shadowBlur,
        shadowColor
      });

      currentX += width + gap;
    }
    
    currentY += lineHeight;
  }
}
