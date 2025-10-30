import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CaptionOverlay } from "./CaptionOverlay";
import { usePlayer } from "@/contexts/PlayerContext";

export const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { captions, setCurrentTime, videoUrl, isLoading } = usePlayer();

  // Setup all video event listeners AND reload when URL changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('🎬 Setting up video for:', videoUrl);

    // Reload video if URL exists
    if (videoUrl) {
      video.load();
    }

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setLocalCurrentTime(time);
      setCurrentTime(time);
    };
    
    const handleLoadedMetadata = () => {
      console.log('📊 Metadata loaded, duration:', video.duration);
      setDuration(video.duration);
    };
    
    const handleLoadedData = () => {
      console.log('✅ Video data loaded successfully');
    };
    
    const handlePlay = () => {
      console.log('▶️ Video playing');
      setIsPlaying(true);
    };
    
    const handlePause = () => {
      console.log('⏸️ Video paused');
      setIsPlaying(false);
    };
    
    const handleEnded = () => {
      console.log('🏁 Video ended');
      setIsPlaying(false);
    };
    
    const handleError = (e: Event) => {
      console.error('❌ Video error:', e);
      console.error('❌ Error code:', video.error?.code);
      console.error('❌ Error message:', video.error?.message);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
    };
  }, [videoUrl]); // ✅ يُنفّذ عند تغيير videoUrl!

  // Update scale factor when video size changes
  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      const video = videoRef.current;
      if (!container || !video) return;
      
      const actualWidth = video.offsetWidth;
      const scale = actualWidth / 1080; // 1080 is the original video width
      
      container.style.setProperty('--video-scale', scale.toString());
    };
    
    updateScale();
    
    // Update on resize
    window.addEventListener('resize', updateScale);
    const video = videoRef.current;
    if (video) {
      video.addEventListener('loadedmetadata', updateScale);
    }
    
    return () => {
      window.removeEventListener('resize', updateScale);
      if (video) {
        video.removeEventListener('loadedmetadata', updateScale);
      }
    };
  }, [videoUrl]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        seekRelative(-0.1);
      } else if (e.code === "ArrowRight") {
        seekRelative(0.1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const seekRelative = (delta: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + delta)
      );
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const activeCaption = captions.find(
    (cap) => cap.visible !== false && currentTime >= cap.start && currentTime < cap.end
  );

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-muted-foreground mb-4">No video exported yet</p>
          <p className="text-sm text-muted-foreground">Click "Export" to generate the final video</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="relative aspect-[9/16] h-full max-h-[80vh]">
          {/* Video and caption container - same size, with scale variable */}
          <div ref={containerRef} className="relative w-full h-full" style={{ '--video-scale': '1' } as React.CSSProperties}>
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'%3E%3Crect width='1080' height='1920' fill='%23000'/%3E%3C/svg%3E"
              preload="auto"
            >
              {videoUrl && <source src={videoUrl} type="video/mp4" />}
            </video>
            
            {/* Caption overlay - inside video frame */}
            {activeCaption && (
              <div className="absolute inset-0 pointer-events-none">
                <CaptionOverlay caption={activeCaption} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="secondary"
            onClick={togglePlay}
            className="shrink-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>

          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.01}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          <span className="text-sm text-muted-foreground shrink-0 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};
