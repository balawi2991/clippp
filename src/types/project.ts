export interface Project {
  id: string;
  title: string;
  thumbnail?: string;
  duration: number; // in seconds
  createdAt: Date;
  prompt?: string;
  script?: string;
  videoUrl?: string;
  settings: {
    language: string;
    music: string;
    imageStyle: string;
    voice: string;
    scriptStyle: string;
    targetLength: number;
    captions: boolean;
    watermark: boolean;
  };
}

export interface GenerationStep {
  id: string;
  label: string;
  completed: boolean;
}

export interface GenerationJob {
  id: string;
  progress: number; // 0-100
  steps: GenerationStep[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  projectId?: string;
}

export type InputMode = 'prompt' | 'script';
export type MusicType = 'none' | 'upbeat' | 'chill' | 'dramatic';
export type ImageStyle = 'stock-video' | 'stock-images';
export type VoiceType = 'male' | 'female' | 'neutral';
export type ScriptStyle = 'default' | 'promo';
