import React from "react";
import { CAPTION_STYLES } from "@/constants/captionStyles";

interface CaptionContainerProps {
  yPercent: number;
  children: React.ReactNode;
}

/**
 * Shared container for all caption rendering modes
 * Ensures consistent positioning and width across all styles
 */
export const CaptionContainer: React.FC<CaptionContainerProps> = ({ yPercent, children }) => {
  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center transition-all duration-150"
      style={{
        top: `${yPercent}%`,
        transform: "translateY(-50%)",
        padding: `0 ${CAPTION_STYLES.CONTAINER.PADDING_HORIZONTAL}px`,
      }}
    >
      <div
        className="relative text-center"
        style={{
          width: `${CAPTION_STYLES.CONTAINER.WIDTH_PERCENT * 100}%`,
          maxWidth: `${CAPTION_STYLES.CONTAINER.WIDTH_PERCENT * 100}%`,
        }}
      >
        {children}
      </div>
    </div>
  );
};
