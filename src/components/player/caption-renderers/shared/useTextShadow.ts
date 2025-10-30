import { useMemo } from "react";
import { Theme } from "@/types/caption";

/**
 * Hook to generate text shadow CSS for captions
 * Creates stroke effect and drop shadow
 */
export const useTextShadow = (theme: Theme) => {
  return useMemo(() => {
    const strokeWidth = `calc(${theme.strokeWidth}px * var(--video-scale, 1))`;
    const shadowBlur = `calc(${theme.shadowBlur}px * var(--video-scale, 1))`;
    
    return `
      ${strokeWidth} ${strokeWidth} 0 ${theme.strokeColor},
      -${strokeWidth} ${strokeWidth} 0 ${theme.strokeColor},
      ${strokeWidth} -${strokeWidth} 0 ${theme.strokeColor},
      -${strokeWidth} -${strokeWidth} 0 ${theme.strokeColor},
      0 ${shadowBlur} calc(${shadowBlur} * 2) ${theme.shadowColor}
    `;
  }, [theme.strokeWidth, theme.strokeColor, theme.shadowBlur, theme.shadowColor]);
};
