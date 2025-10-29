import React, { useRef, useState, useEffect } from "react";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { CaptionOverlay } from "./CaptionOverlay";
import { usePlayer } from "@/contexts/PlayerContext";

export const VideoPreview: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setLocalCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const { captions, setCurrentTime } = usePlayer();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const time = video.currentTime;
      setLocalCurrentTime(time);
      setCurrentTime(time);
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [setCurrentTime]);

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

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center">
        <div className="relative aspect-[9/16] h-full max-h-[80vh]">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1080' height='1920'%3E%3Crect width='1080' height='1920' fill='%23000'/%3E%3C/svg%3E"
          >
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
          </video>
          
          {activeCaption && <CaptionOverlay caption={activeCaption} />}
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
