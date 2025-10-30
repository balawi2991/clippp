/**
 * Word-by-Word Renderer
 * Renders only one word at a time
 */

import { drawTextWithEffects } from './shared/textEffects.js';

/**
 * Render single word
 */
export async function renderSingleWord(ctx, word, x, y, style) {
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
  
  drawTextWithEffects(ctx, word, x, y, {
    textColor,
    strokeWidth,
    strokeColor,
    shadowBlur,
    shadowColor
  });
}
