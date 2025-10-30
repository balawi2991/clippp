import React from "react";
import { CaptionBlock, Theme } from "@/types/caption";
import { CaptionContainer } from "./shared/CaptionContainer";
import { useScaledValues } from "./shared/useScaledValues";
import { useTextShadow } from "./shared/useTextShadow";

interface FullTextRendererProps {
  caption: CaptionBlock;
  theme: Theme;
  textColor: string;
  highlightColor: string;
  fontSize: number;
  yPercent: number;
}

/**
 * Renders caption in full text mode
 * Supports both with and without background
 */
export const FullTextRenderer: React.FC<FullTextRendererProps> = ({
  caption,
  theme,
  textColor,
  highlightColor,
  fontSize,
  yPercent,
}) => {
  const scaled = useScaledValues(theme, fontSize);
  const textShadow = useTextShadow(theme);

  const baseTextStyle: React.CSSProperties = {
    color: textColor,
    fontSize: scaled.fontSize,
    fontWeight: theme.fontWeight,
    textShadow,
  };

  // With background
  if (theme.highlightMode === "full-background") {
    return (
      <CaptionContainer yPercent={yPercent}>
        <div
          style={{
            backgroundColor: highlightColor,
            padding: `${scaled.fullTextPadding.vertical} ${scaled.fullTextPadding.horizontal}`,
            borderRadius: scaled.fullTextRadius,
          }}
        >
          <span className="font-bold leading-tight whitespace-pre-wrap break-words" style={baseTextStyle}>
            {caption.text}
          </span>
        </div>
      </CaptionContainer>
    );
  }

  // Without background
  return (
    <CaptionContainer yPercent={yPercent}>
      <span className="font-bold leading-tight whitespace-pre-wrap break-words" style={baseTextStyle}>
        {caption.text}
      </span>
    </CaptionContainer>
  );
};
