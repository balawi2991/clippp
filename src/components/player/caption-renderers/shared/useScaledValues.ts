import { useMemo } from "react";
import { Theme } from "@/types/caption";
import { CAPTION_STYLES } from "@/constants/captionStyles";

/**
 * Hook to calculate scaled CSS values for responsive caption rendering
 */
export const useScaledValues = (theme: Theme, fontSize: number) => {
  return useMemo(() => {
    const scale = (value: number) => `calc(${value}px * var(--video-scale, 1))`;
    
    return {
      // Base text styles
      fontSize: scale(fontSize),
      strokeWidth: scale(theme.strokeWidth),
      shadowBlur: scale(theme.shadowBlur),
      
      // Full text background
      fullTextPadding: {
        horizontal: scale(CAPTION_STYLES.FULL_TEXT_BACKGROUND.PADDING.horizontal),
        vertical: scale(CAPTION_STYLES.FULL_TEXT_BACKGROUND.PADDING.vertical),
      },
      fullTextRadius: scale(CAPTION_STYLES.FULL_TEXT_BACKGROUND.BORDER_RADIUS),
      
      // Karaoke
      karaokeGap: scale(CAPTION_STYLES.KARAOKE.GAP),
      karaokeWordHighlight: {
        padding: {
          horizontal: scale(CAPTION_STYLES.KARAOKE.WORD_HIGHLIGHT.PADDING.horizontal),
          vertical: scale(CAPTION_STYLES.KARAOKE.WORD_HIGHLIGHT.PADDING.vertical),
        },
        radius: scale(CAPTION_STYLES.KARAOKE.WORD_HIGHLIGHT.BORDER_RADIUS),
      },
      karaokeFullBackground: {
        padding: {
          horizontal: scale(CAPTION_STYLES.KARAOKE.FULL_BACKGROUND.PADDING.horizontal),
          vertical: scale(CAPTION_STYLES.KARAOKE.FULL_BACKGROUND.PADDING.vertical),
        },
        radius: scale(CAPTION_STYLES.KARAOKE.FULL_BACKGROUND.BORDER_RADIUS),
      },
    };
  }, [theme, fontSize]);
};
