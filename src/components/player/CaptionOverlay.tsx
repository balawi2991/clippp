import React, { useMemo } from "react";
import { CaptionBlock } from "@/types/caption";
import { usePlayer } from "@/contexts/PlayerContext";
import { PRESET_THEMES } from "@/data/themes";

interface CaptionOverlayProps {
  caption: CaptionBlock;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ caption }) => {
  const { currentTheme, themeOverrides, yPercent, currentTime } = usePlayer();
  const theme = PRESET_THEMES[currentTheme];

  const textColor = caption.styleOverrides?.textColor || themeOverrides.textColor || theme.textColor;
  const highlightColor = caption.styleOverrides?.highlightColor || themeOverrides.highlightColor || theme.highlightColor;
  const fontSize = themeOverrides.fontSize || theme.fontSize;

  // Split text into words
  const words = useMemo(() => caption.text.split(" "), [caption.text]);
  
  // Calculate which word should be active (for karaoke and word-by-word modes)
  const activeWordIndex = useMemo(() => {
    if (!caption.start || !caption.end) return 0;
    const captionDuration = caption.end - caption.start;
    const timeIntoCaption = currentTime - caption.start;
    const progress = Math.max(0, Math.min(1, timeIntoCaption / captionDuration));
    return Math.floor(progress * words.length);
  }, [currentTime, caption.start, caption.end, words.length]);

  const baseTextStyle = {
    color: textColor,
    fontSize: `${fontSize}px`,
    fontWeight: theme.fontWeight,
    textShadow: `
      ${theme.strokeWidth}px ${theme.strokeWidth}px 0 ${theme.strokeColor},
      -${theme.strokeWidth}px ${theme.strokeWidth}px 0 ${theme.strokeColor},
      ${theme.strokeWidth}px -${theme.strokeWidth}px 0 ${theme.strokeColor},
      -${theme.strokeWidth}px -${theme.strokeWidth}px 0 ${theme.strokeColor},
      0 ${theme.shadowBlur}px ${theme.shadowBlur * 2}px ${theme.shadowColor}
    `,
  };

  // FULL TEXT MODE (with full background)
  if (theme.displayMode === "full" && theme.highlightMode === "full-background") {
    return (
      <div
        className="absolute inset-x-0 flex items-center justify-center px-12 py-8 transition-all duration-150"
        style={{
          top: `${Math.max(10, Math.min(75, yPercent))}%`,
          transform: "translateY(-50%)",
        }}
      >
        <div
          className="relative px-6 py-3 rounded-2xl max-w-[85%] text-center"
          style={{
            backgroundColor: highlightColor,
          }}
        >
          <span className="font-bold leading-tight break-words" style={baseTextStyle}>
            {caption.text}
          </span>
        </div>
      </div>
    );
  }

  // FULL TEXT MODE (no background)
  if (theme.displayMode === "full" && theme.highlightMode === "none") {
    return (
      <div
        className="absolute inset-x-0 flex items-center justify-center px-12 py-8 transition-all duration-150"
        style={{
          top: `${Math.max(10, Math.min(75, yPercent))}%`,
          transform: "translateY(-50%)",
        }}
      >
        <div className="relative max-w-[85%] text-center">
          <span className="font-bold leading-tight break-words" style={baseTextStyle}>
            {caption.text}
          </span>
        </div>
      </div>
    );
  }

  // WORD-BY-WORD MODE (show only current word with stroke)
  if (theme.displayMode === "word-by-word") {
    const currentWord = words[Math.min(activeWordIndex, words.length - 1)] || "";
    
    return (
      <div
        className="absolute inset-x-0 flex items-center justify-center px-12 py-8"
        style={{
          top: `${Math.max(10, Math.min(75, yPercent))}%`,
          transform: "translateY(-50%)",
        }}
      >
        <div className="relative max-w-[85%] text-center">
          <span 
            className="font-bold leading-tight animate-scale-in break-words" 
            style={baseTextStyle}
            key={`${caption.id}-${activeWordIndex}`}
          >
            {currentWord}
          </span>
        </div>
      </div>
    );
  }

  // KARAOKE MODE (show all words, highlight current one)
  if (theme.displayMode === "karaoke") {
    return (
      <div
        className="absolute inset-x-0 flex items-center justify-center px-12 py-8 transition-all duration-150"
        style={{
          top: `${Math.max(10, Math.min(75, yPercent))}%`,
          transform: "translateY(-50%)",
        }}
      >
        <div className="relative max-w-[85%] text-center">
          <div className="inline-flex flex-wrap gap-2 justify-center items-center">
            {words.map((word, index) => {
              const isActive = index === activeWordIndex;
              
              if (theme.highlightMode === "word-highlight") {
                return (
                  <span
                    key={`${caption.id}-${index}`}
                    className="font-bold leading-tight transition-all duration-150"
                    style={{
                      ...baseTextStyle,
                      backgroundColor: isActive ? highlightColor : "transparent",
                      padding: isActive ? "4px 12px" : "4px 0",
                      borderRadius: isActive ? "12px" : "0",
                      transform: isActive ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    {word}
                  </span>
                );
              }
              
              // full-background mode for karaoke
              return (
                <span
                  key={`${caption.id}-${index}`}
                  className="font-bold leading-tight transition-all duration-150 px-3 py-2 rounded-xl"
                  style={{
                    ...baseTextStyle,
                    backgroundColor: highlightColor,
                    opacity: isActive ? 1 : 0.5,
                    transform: isActive ? "scale(1.15)" : "scale(1)",
                  }}
                >
                  {word}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Fallback: show full text
  return (
    <div
      className="absolute inset-x-0 flex items-center justify-center px-12 py-8 transition-all duration-150"
      style={{
        top: `${Math.max(10, Math.min(75, yPercent))}%`,
        transform: "translateY(-50%)",
      }}
    >
      <div className="relative max-w-[85%] text-center">
        <span className="font-bold leading-tight break-words" style={baseTextStyle}>
          {caption.text}
        </span>
      </div>
    </div>
  );
};
