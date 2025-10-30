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
    if (!caption.start || !caption.end) return 0;
    const captionDuration = caption.end - caption.start;
    const timeIntoCaption = currentTime - caption.start;
    const progress = Math.max(0, Math.min(1, timeIntoCaption / captionDuration));
    return Math.floor(progress * words.length);
  }, [currentTime, caption.start, caption.end, words.length]);

  const currentWord = words[Math.min(activeWordIndex, words.length - 1)] || "";

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
