/**
 * Full Text Renderer
 * Renders caption in full text mode (with or without background)
 */

import { CAPTION_STYLES, getMaxTextWidth } from '../../constants/captionStyles.js';
import { drawTextWithEffects, roundRect, wrapText } from './shared/textEffects.js';

const VIDEO_WIDTH = 1080;

/**
 * Render full text with background
 */
export async function renderFullWithBackground(ctx, text, x, y, style) {
  const {
    fontSize,
    fontWeight,
    fontFamily,
    textColor,
    highlightColor,
    strokeWidth,
    strokeColor,
    shadowBlur,
    shadowColor
  } = style;

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Handle text wrapping
  const maxWidth = getMaxTextWidth(VIDEO_WIDTH);
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  
  // Calculate starting Y position (centered vertically)
  const startY = y - (totalHeight / 2) + (lineHeight / 2);
  
  // Draw background for all lines combined
  const { horizontal: paddingH, vertical: paddingV } = CAPTION_STYLES.FULL_TEXT_BACKGROUND.PADDING;
  const radius = CAPTION_STYLES.FULL_TEXT_BACKGROUND.BORDER_RADIUS;
  
  // Find widest line
  const maxLineWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
  
  const bgX = x - maxLineWidth / 2 - paddingH;
  const bgY = startY - lineHeight / 2 - paddingV;
  const bgWidth = maxLineWidth + paddingH * 2;
  const bgHeight = totalHeight + paddingV * 2;

  ctx.fillStyle = highlightColor;
  roundRect(ctx, bgX, bgY, bgWidth, bgHeight, radius);
  ctx.fill();

  // Draw each line
  lines.forEach((line, index) => {
    const lineY = startY + (index * lineHeight);
    drawTextWithEffects(ctx, line, x, lineY, {
      textColor,
      strokeWidth,
      strokeColor,
      shadowBlur,
      shadowColor
    });
  });
}

/**
 * Render full text without background
 */
export async function renderFullText(ctx, text, x, y, style) {
  const {
    fontSize,
    fontWeight,
    fontFamily,
    textColor,
    strokeWidth,
    strokeColor,
    shadowBlur,
    shadowColor
  } = style;

  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  
  // Handle text wrapping
  const maxWidth = getMaxTextWidth(VIDEO_WIDTH);
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.2;
  
  // Calculate starting Y position (centered vertically)
  const totalHeight = lines.length * lineHeight;
  const startY = y - (totalHeight / 2) + (lineHeight / 2);
  
  // Draw each line
  lines.forEach((line, index) => {
    const lineY = startY + (index * lineHeight);
    drawTextWithEffects(ctx, line, x, lineY, {
      textColor,
      strokeWidth,
      strokeColor,
      shadowBlur,
      shadowColor
    });
  });
}
