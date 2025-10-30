/**
 * Shared Caption Style Constants
 * Used by both Frontend (Preview) and Backend (Export) to ensure consistency
 */

export const CAPTION_STYLES = {
  // Container settings
  CONTAINER: {
    WIDTH_PERCENT: 0.99, // 99% of video width
    PADDING_HORIZONTAL: 4, // px padding from edges
  },

  // Full text mode with background
  FULL_TEXT_BACKGROUND: {
    PADDING: {
      horizontal: 24,
      vertical: 8,
    },
    BORDER_RADIUS: 16,
  },

  // Karaoke mode
  KARAOKE: {
    GAP: 16, // Gap between words
    
    // Word highlight style
    WORD_HIGHLIGHT: {
      PADDING: {
        horizontal: 12,
        vertical: 4,
      },
      BORDER_RADIUS: 12,
    },
    
    // Full background style
    FULL_BACKGROUND: {
      PADDING: {
        horizontal: 12,
        vertical: 8,
      },
      BORDER_RADIUS: 16,
    },
  },

  // Word-by-word mode (uses same as karaoke word-highlight)
  WORD_BY_WORD: {
    PADDING: {
      horizontal: 12,
      vertical: 4,
    },
    BORDER_RADIUS: 12,
  },
} as const;

// Helper to calculate max width for text
export const getMaxTextWidth = (videoWidth: number = 1080): number => {
  return videoWidth * CAPTION_STYLES.CONTAINER.WIDTH_PERCENT 
         - (CAPTION_STYLES.CONTAINER.PADDING_HORIZONTAL * 2);
};
