import React, { useMemo } from "react";
import { CaptionBlock, Theme } from "@/types/caption";
import { CaptionContainer } from "./shared/CaptionContainer";
import { useScaledValues } from "./shared/useScaledValues";
import { useTextShadow } from "./shared/useTextShadow";

interface WordByWordRendererProps {
  caption: CaptionBlock;
  theme: Theme;
  textColor: string;
  fontSize: number;
  yPercent: number;
  currentTime: number;
}

/**
 * Renders caption in word-by-word mode
 * Shows only one word at a time
 */
export const WordByWordRenderer: React.FC<WordByWordRendererProps> = ({
  caption,
  theme,
  textColor,
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
        // Show word only during its exact timing
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

  const currentWord = activeWordIndex !== null ? (words[activeWordIndex] || "") : "";

  const textStyle: React.CSSProperties = {
    color: textColor,
    fontSize: scaled.fontSize,
    fontWeight: theme.fontWeight,
    textShadow,
  };

  return (
    <CaptionContainer yPercent={yPercent}>
      <span
        className="font-bold leading-tight animate-scale-in"
        style={textStyle}
        key={`${caption.id}-${activeWordIndex}`}
      >
        {currentWord}
      </span>
    </CaptionContainer>
  );
};
