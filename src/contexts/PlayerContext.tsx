import React, { createContext, useContext, useState, useCallback } from "react";
import { CaptionBlock, ThemeOverrides, PlayerConfig } from "@/types/caption";
import { PRESET_THEMES } from "@/data/themes";
import { toast } from "@/hooks/use-toast";

interface PlayerContextType {
  currentTheme: string;
  themeOverrides: ThemeOverrides;
  captions: CaptionBlock[];
  yPercent: number;
  currentTime: number;
  videoUrl: string | null;
  isLoading: boolean;
  setCurrentTheme: (theme: string) => void;
  updateThemeOverride: (key: keyof ThemeOverrides, value: any) => void;
  setYPercent: (value: number) => void;
  setCurrentTime: (time: number) => void;
  addCaption: () => void;
  updateCaption: (id: string, updates: Partial<CaptionBlock>) => void;
  deleteCaption: (id: string) => void;
  reorderCaptions: (fromIndex: number, toIndex: number) => void;
  saveConfig: () => void;
  exportConfig: () => void;
  loadConfig: (config: PlayerConfig) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode; projectId?: string }> = ({ children, projectId }) => {
  const [currentTheme, setCurrentTheme] = useState("HORMOZI");
  const [themeOverrides, setThemeOverrides] = useState<ThemeOverrides>({
    textColor: "#FFFFFF",
    highlightColor: "#00FF00",
    fontSize: 85,
    yPercent: 50,
  });
  const [captions, setCaptions] = useState<CaptionBlock[]>([]);
  const [yPercent, setYPercent] = useState(50);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load project data on mount
  React.useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:3001/api/projects/${projectId}`);
        if (!response.ok) throw new Error('Failed to load project');
        
        const project = await response.json();
        
        // Load style
        const style = JSON.parse(project.styleJson);
        
        // Check if it's old format (no theme/overrides structure)
        let themeName, loadedOverrides;
        
        if (style.theme && style.overrides) {
          // New format ✅
          themeName = style.theme;
          loadedOverrides = style.overrides;
          console.log('✅ Loaded style (new format):', { themeName, overrides: loadedOverrides });
        } else {
          // Old format - migrate to new format
          console.log('⚠️ Old format detected, migrating...');
          
          // Detect theme from old properties
          themeName = 'HORMOZI'; // Default
          if (style.displayMode === 'word-by-word' && style.textColor === '#FFEB3B') {
            themeName = 'VIRAL';
          } else if (style.displayMode === 'full' && style.highlightMode === 'full-background' && style.highlightColor === '#FFD700') {
            themeName = 'BEAST';
          } else if (style.displayMode === 'full' && style.highlightMode === 'none') {
            themeName = 'MINIMAL';
          } else if (style.textColor === '#00FFFF') {
            themeName = 'NEON';
          }
          
          loadedOverrides = {
            textColor: style.textColor || '#FFFFFF',
            highlightColor: style.highlightColor || '#00FF00',
            fontSize: style.fontSize || 85,
            yPercent: style.yPercent || 50,
          };
          
          console.log('✅ Migrated to:', { themeName, overrides: loadedOverrides });
        }
        
        const defaultTheme = PRESET_THEMES[themeName];
        setCurrentTheme(themeName);
        
        // Merge with defaults
        const finalOverrides = {
          textColor: loadedOverrides.textColor || defaultTheme.textColor,
          highlightColor: loadedOverrides.highlightColor || defaultTheme.highlightColor,
          fontSize: loadedOverrides.fontSize || defaultTheme.fontSize,
          yPercent: loadedOverrides.yPercent || 50,
        };
        
        setThemeOverrides(finalOverrides);
        setYPercent(finalOverrides.yPercent);
        
        // Load captions
        if (project.captions && project.captions.length > 0) {
          const loadedCaptions = project.captions.map((cap: any) => ({
            id: cap.id,
            start: cap.startTime,
            end: cap.endTime,
            text: cap.text,
            visible: true
          }));
          setCaptions(loadedCaptions);
        }
        
        // Load preview video ONLY (for editing with live caption overlay)
        // Export video (with burned captions) is only for download, not for player
        const previewPath = `http://localhost:3001/storage/${projectId}/preview/base_video.mp4`;
        
        try {
          // Load preview video (without burned captions)
          const previewCheck = await fetch(previewPath, { method: 'HEAD' });
          if (previewCheck.ok) {
            console.log('Loading preview video (for editing):', previewPath);
            setVideoUrl(previewPath);
          } else {
            console.warn('Preview video not found yet');
          }
        } catch (e) {
          console.error('Error loading video:', e);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to load project:', error);
        setIsLoading(false);
      }
    };

    loadProject();
  }, [projectId]);

  // Auto-save to database when settings change
  React.useEffect(() => {
    if (!projectId || isLoading) return;

    const autoSave = async () => {
      try {
        const theme = PRESET_THEMES[currentTheme];
        const styleJson = JSON.stringify({
          theme: currentTheme,
          overrides: {
            textColor: themeOverrides.textColor,
            highlightColor: themeOverrides.highlightColor,
            fontSize: themeOverrides.fontSize,
            yPercent,
          },
          // Include theme properties for export
          fontFamily: theme.fontFamily,
          fontWeight: theme.fontWeight,
          strokeWidth: theme.strokeWidth,
          strokeColor: theme.strokeColor,
          shadowBlur: theme.shadowBlur,
          shadowColor: theme.shadowColor,
          displayMode: theme.displayMode,
          highlightMode: theme.highlightMode,
        });

        await fetch(`http://localhost:3001/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ styleJson }),
        });

        console.log('✅ Auto-saved:', { theme: currentTheme, overrides: { ...themeOverrides, yPercent } });
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    };

    // Debounce auto-save (wait 500ms after last change)
    const timeoutId = setTimeout(autoSave, 500);
    return () => clearTimeout(timeoutId);
  }, [projectId, currentTheme, themeOverrides, yPercent, isLoading]);

  const updateThemeOverride = useCallback((key: keyof ThemeOverrides, value: any) => {
    setThemeOverrides((prev) => ({ ...prev, [key]: value }));
  }, []);

  const addCaption = useCallback(() => {
    const lastCaption = captions[captions.length - 1];
    const newStart = lastCaption ? lastCaption.end : 0;
    const newEnd = newStart + 1;
    const newCaption: CaptionBlock = {
      id: `c${Date.now()}`,
      start: newStart,
      end: newEnd,
      text: "",
      visible: true,
    };
    setCaptions((prev) => [...prev, newCaption]);
  }, [captions]);

  const updateCaption = useCallback((id: string, updates: Partial<CaptionBlock>) => {
    setCaptions((prev) =>
      prev.map((cap) => (cap.id === id ? { ...cap, ...updates } : cap))
    );
  }, []);

  const deleteCaption = useCallback((id: string) => {
    setCaptions((prev) => prev.filter((cap) => cap.id !== id));
  }, []);

  const reorderCaptions = useCallback((fromIndex: number, toIndex: number) => {
    setCaptions((prev) => {
      const newCaptions = [...prev];
      const [moved] = newCaptions.splice(fromIndex, 1);
      newCaptions.splice(toIndex, 0, moved);
      return newCaptions;
    });
  }, []);

  const saveConfig = useCallback(async () => {
    if (!projectId) return;

    try {
      // Manual save (same as auto-save but with toast)
      const theme = PRESET_THEMES[currentTheme];
      const styleJson = JSON.stringify({
        theme: currentTheme,
        overrides: {
          textColor: themeOverrides.textColor,
          highlightColor: themeOverrides.highlightColor,
          fontSize: themeOverrides.fontSize,
          yPercent,
        },
        // Include theme properties for export
        fontFamily: theme.fontFamily,
        fontWeight: theme.fontWeight,
        strokeWidth: theme.strokeWidth,
        strokeColor: theme.strokeColor,
        shadowBlur: theme.shadowBlur,
        shadowColor: theme.shadowColor,
        displayMode: theme.displayMode,
        highlightMode: theme.highlightMode,
      });

      const response = await fetch(`http://localhost:3001/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ styleJson }),
      });

      if (!response.ok) throw new Error('Failed to save style');

      toast({
        title: "Configuration saved",
        description: "Your settings have been saved.",
      });
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: "Could not save configuration.",
        variant: "destructive",
      });
    }
  }, [projectId, currentTheme, themeOverrides, yPercent]);

  const exportConfig = useCallback(() => {
    const config: PlayerConfig = {
      version: 1,
      theme: {
        name: currentTheme,
        overrides: themeOverrides,
      },
      captions,
    };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "caption-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Configuration exported",
      description: "Config file downloaded successfully.",
    });
  }, [currentTheme, themeOverrides, captions]);

  const loadConfig = useCallback((config: PlayerConfig) => {
    setCurrentTheme(config.theme.name);
    setThemeOverrides(config.theme.overrides);
    setCaptions(config.captions);
    setYPercent(config.theme.overrides.yPercent || 50);
    toast({
      title: "Configuration loaded",
      description: "Settings restored successfully.",
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentTheme,
        themeOverrides,
        captions,
        yPercent,
        currentTime,
        videoUrl,
        isLoading,
        setCurrentTheme,
        updateThemeOverride,
        setYPercent,
        setCurrentTime,
        addCaption,
        updateCaption,
        deleteCaption,
        reorderCaptions,
        saveConfig,
        exportConfig,
        loadConfig,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within PlayerProvider");
  }
  return context;
};
