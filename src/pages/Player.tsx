import React from "react";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import { VideoPreview } from "@/components/player/VideoPreview";
import { ControlPanel } from "@/components/player/ControlPanel";
import { PlayerProvider, usePlayer } from "@/contexts/PlayerContext";

const PlayerContent: React.FC = () => {
  const { saveConfig, exportConfig } = usePlayer();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-6 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Caption Studio</h1>
          <div className="flex items-center gap-2">
            <Button onClick={saveConfig} variant="secondary" size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            <Button onClick={exportConfig} variant="default" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
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
  return (
    <PlayerProvider>
      <PlayerContent />
    </PlayerProvider>
  );
};

export default Player;
