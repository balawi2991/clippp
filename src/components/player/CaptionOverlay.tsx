import React from "react";
import { CaptionBlock } from "@/types/caption";
import { usePlayer } from "@/contexts/PlayerContext";
import { PRESET_THEMES } from "@/data/themes";

interface CaptionOverlayProps {
  caption: CaptionBlock;
}

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({ caption }) => {
  const { currentTheme, themeOverrides, yPercent } = usePlayer();
  const theme = PRESET_THEMES[currentTheme];

  const textColor = caption.styleOverrides?.textColor || themeOverrides.textColor || theme.textColor;
  const highlightColor = caption.styleOverrides?.highlightColor || themeOverrides.highlightColor || theme.highlightColor;
  const fontSize = themeOverrides.fontSize || theme.fontSize;

  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center px-8 transition-all duration-150"
      style={{
        top: `${yPercent}%`,
        transform: "translateY(-50%)",
      }}
    >
      <div
        className="relative px-6 py-3 rounded-2xl max-w-[90%] text-center"
        style={{
          backgroundColor: highlightColor,
        }}
      >
        <span
          className="font-bold leading-tight"
          style={{
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
          }}
        >
          {caption.text}
        </span>
      </div>
    </div>
  );
};
