export interface CaptionBlock {
  id: string;
  start: number;
  end: number;
  text: string;
  visible?: boolean;
  offsetMs?: number;
  styleOverrides?: {
    textColor?: string;
    highlightColor?: string;
  };
}

export interface Theme {
  name: string;
  fontFamily: string;
  fontWeight: number;
  textColor: string;
  highlightColor: string;
  fontSize: number;
  strokeWidth: number;
  strokeColor: string;
  shadowBlur: number;
  shadowColor: string;
  displayMode: "full" | "word-by-word" | "karaoke";
  highlightMode: "full-background" | "word-highlight" | "none" | "stroke-only";
}

export interface ThemeOverrides {
  textColor?: string;
  highlightColor?: string;
  fontSize?: number;
  yPercent?: number;
}

export interface PlayerConfig {
  version: number;
  theme: {
    name: string;
    overrides: ThemeOverrides;
  };
  captions: CaptionBlock[];
}
