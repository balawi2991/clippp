import React from "react";
import { CaptionBlock } from "@/types/caption";
import { usePlayer } from "@/contexts/PlayerContext";
import { PRESET_THEMES } from "@/data/themes";
import { FullTextRenderer } from "./caption-renderers/FullTextRenderer";
import { KaraokeRenderer } from "./caption-renderers/KaraokeRenderer";
import { WordByWordRenderer } from "./caption-renderers/WordByWordRenderer";

interface CaptionOverlayProps {
  caption: CaptionBlock;
}

/**
 * Main caption overlay component
 * Routes to appropriate renderer based on display mode
 */
export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ caption }) => {
  const { currentTheme, themeOverrides, yPercent, currentTime } = usePlayer();
  const theme = PRESET_THEMES[currentTheme];

  const textColor = caption.styleOverrides?.textColor || themeOverrides.textColor || theme.textColor;
  const highlightColor = caption.styleOverrides?.highlightColor || themeOverrides.highlightColor || theme.highlightColor;
  const fontSize = themeOverrides.fontSize || theme.fontSize;

  const commonProps = {
    caption,
    theme,
    textColor,
    highlightColor,
    fontSize,
    yPercent,
    currentTime,
  };

  // Route to appropriate renderer based on display mode
  switch (theme.displayMode) {
    case "full":
      return <FullTextRenderer {...commonProps} />;
    
    case "karaoke":
      return <KaraokeRenderer {...commonProps} />;
    
    case "word-by-word":
      return <WordByWordRenderer {...commonProps} />;
    
    default:
      // Fallback to full text
      return <FullTextRenderer {...commonProps} />;
  }
};
