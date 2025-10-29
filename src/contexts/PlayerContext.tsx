import React, { createContext, useContext, useState, useCallback } from "react";
import { CaptionBlock, ThemeOverrides, PlayerConfig } from "@/types/caption";
import { PRESET_THEMES } from "@/data/themes";
import { toast } from "@/hooks/use-toast";

interface PlayerContextType {
  currentTheme: string;
  themeOverrides: ThemeOverrides;
  captions: CaptionBlock[];
  yPercent: number;
  setCurrentTheme: (theme: string) => void;
  updateThemeOverride: (key: keyof ThemeOverrides, value: any) => void;
  setYPercent: (value: number) => void;
  addCaption: () => void;
  updateCaption: (id: string, updates: Partial<CaptionBlock>) => void;
  deleteCaption: (id: string) => void;
  reorderCaptions: (fromIndex: number, toIndex: number) => void;
  saveConfig: () => void;
  exportConfig: () => void;
  loadConfig: (config: PlayerConfig) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState("HORMOZI");
  const [themeOverrides, setThemeOverrides] = useState<ThemeOverrides>({
    textColor: "#FFFFFF",
    highlightColor: "#2BF82A",
    fontSize: 80,
    yPercent: 50,
  });
  const [captions, setCaptions] = useState<CaptionBlock[]>([
    { id: "c1", start: 0.28, end: 1.71, text: "napoleon bonaparte", visible: true },
    { id: "c2", start: 1.71, end: 2.03, text: "one of", visible: true },
    { id: "c3", start: 2.03, end: 2.91, text: "the most", visible: true },
    { id: "c4", start: 2.91, end: 3.63, text: "influential figures", visible: true },
    { id: "c5", start: 3.63, end: 4.34, text: "in european", visible: true },
  ]);
  const [yPercent, setYPercent] = useState(50);

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

  const saveConfig = useCallback(() => {
    const config: PlayerConfig = {
      version: 1,
      theme: {
        name: currentTheme,
        overrides: themeOverrides,
      },
      captions,
    };
    localStorage.setItem("caption-player-config", JSON.stringify(config));
    toast({
      title: "Configuration saved",
      description: "Your settings have been saved to local storage.",
    });
  }, [currentTheme, themeOverrides, captions]);

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
        setCurrentTheme,
        updateThemeOverride,
        setYPercent,
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
