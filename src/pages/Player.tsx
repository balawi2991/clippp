import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Download, ArrowLeft } from "lucide-react";
import { VideoPreview } from "@/components/player/VideoPreview";
import { ControlPanel } from "@/components/player/ControlPanel";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";
import { useParams, useNavigate } from "react-router-dom";
import { useProjects } from "@/contexts/ProjectsContext";
import { toast } from "@/hooks/use-toast";

const PlayerContent: React.FC = () => {
  const { saveConfig, exportConfig } = usePlayer();
  const { id } = useParams();
  const navigate = useNavigate();
  const { startExport, pollJob } = useProjects();
  const [isExporting, setIsExporting] = useState(false);

  const [exportedVideoUrl, setExportedVideoUrl] = useState<string | null>(null);

  const handleExport = async () => {
    if (!id) return;

    setIsExporting(true);
    setExportedVideoUrl(null);

    try {
      // Start export
      const jobId = await startExport(id);

      if (!jobId) {
        setIsExporting(false);
        return;
      }

      toast({
        title: "Export started",
        description: "Your video is being exported...",
      });

      // Poll job
      await pollJob(jobId);

      // Get video URL
      const videoUrl = `http://localhost:3001/storage/${id}/exports/final.mp4`;
      setExportedVideoUrl(videoUrl);

      toast({
        title: "Export complete!",
        description: "Your video is ready to download.",
      });

      setIsExporting(false);
    } catch (error) {
      console.error("Export error:", error);
      setIsExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportedVideoUrl) return;

    const link = document.createElement('a');
    link.href = exportedVideoUrl;
    link.download = `video_${id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download started",
      description: "Your video is being downloaded.",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => navigate("/dashboard")} variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold">Caption Studio</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={saveConfig} variant="secondary" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            {exportedVideoUrl ? (
              <Button 
                onClick={handleDownload} 
                variant="default" 
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            ) : (
              <Button 
                onClick={handleExport} 
                variant="default" 
                size="sm"
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="mx-auto max-w-[1800px] h-[calc(100vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <div className="flex flex-col">
              <VideoPreview />
            </div>
            <div className="flex flex-col">
              <ControlPanel />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const Player: React.FC = () => {
  const { id } = useParams();
  
  return (
    <PlayerProvider projectId={id}>
      <PlayerContent />
    </PlayerProvider>
  );
};

export default Player;
