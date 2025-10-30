import React, { useMemo } from "react";
import { CaptionBlock, Theme } from "@/types/caption";
import { CaptionContainer } from "./shared/CaptionContainer";
import { useScaledValues } from "./shared/useScaledValues";
import { useTextShadow } from "./shared/useTextShadow";

interface KaraokeRendererProps {
  caption: CaptionBlock;
  theme: Theme;
  textColor: string;
  highlightColor: string;
  fontSize: number;
  yPercent: number;
  currentTime: number;
}

/**
 * Renders caption in karaoke mode
 * Shows all words with current word highlighted
 */
export const KaraokeRenderer: React.FC<KaraokeRendererProps> = ({
  caption,
  theme,
  textColor,
  highlightColor,
  fontSize,
  yPercent,
  currentTime,
}) => {
  const scaled = useScaledValues(theme, fontSize);
  const textShadow = useTextShadow(theme);

  const words = useMemo(() => caption.text.split(" "), [caption.text]);

  const activeWordIndex = useMemo(() => {
    if (!caption.start || !caption.end) return null;
    
    // Use precise word timing from Whisper if available
    if (caption.words && caption.words.length > 0) {
      // Find the word that is currently being spoken
      for (let i = 0; i < caption.words.length; i++) {
        const word = caption.words[i];
        // Highlight only during the exact word timing
        if (currentTime >= word.s && currentTime < word.e) {
          return i;
        }
      }
      // No word is active at this time (pause between words or after caption ends)
      return null;
    }
    
    // Fallback: distribute time evenly (only if within caption duration)
    if (currentTime < caption.start || currentTime >= caption.end) {
      return null; // Outside caption time range
    }
    
    const captionDuration = caption.end - caption.start;
    const timeIntoCaption = currentTime - caption.start;
    const progress = Math.max(0, Math.min(1, timeIntoCaption / captionDuration));
    return Math.floor(progress * words.length);
  }, [currentTime, caption.start, caption.end, caption.words, words.length]);

  const baseTextStyle: React.CSSProperties = {
    color: textColor,
    fontSize: scaled.fontSize,
    fontWeight: theme.fontWeight,
    textShadow,
  };

  return (
    <CaptionContainer yPercent={yPercent}>
      <div className="inline-flex flex-wrap justify-center" style={{ gap: scaled.karaokeGap }}>
        {words.map((word, index) => {
          const isActive = activeWordIndex !== null && index === activeWordIndex;

          // Word highlight mode
          if (theme.highlightMode === "word-highlight") {
            return (
              <span
                key={`${caption.id}-${index}`}
                className="font-bold leading-tight transition-all duration-150"
                style={{
                  ...baseTextStyle,
                  backgroundColor: isActive ? highlightColor : "transparent",
                  padding: isActive
                    ? `${scaled.karaokeWordHighlight.padding.vertical} ${scaled.karaokeWordHighlight.padding.horizontal}`
                    : `calc(4px * var(--video-scale, 1)) 0`,
                  borderRadius: isActive ? scaled.karaokeWordHighlight.radius : "0",
                  transform: isActive ? "scale(1.1)" : "scale(1)",
                }}
              >
                {word}
              </span>
            );
          }

          // Full background mode
          return (
            <span
              key={`${caption.id}-${index}`}
              className="font-bold leading-tight transition-all duration-150"
              style={{
                ...baseTextStyle,
                backgroundColor: highlightColor,
                opacity: isActive ? 1 : 0.5,
                transform: isActive ? "scale(1.15)" : "scale(1)",
                padding: `${scaled.karaokeFullBackground.padding.vertical} ${scaled.karaokeFullBackground.padding.horizontal}`,
                borderRadius: scaled.karaokeFullBackground.radius,
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </CaptionContainer>
  );
};
