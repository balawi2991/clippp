import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, ChevronUp } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { PRESET_THEMES } from "@/data/themes";

export const StyleTab: React.FC = () => {
  const {
    currentTheme,
    themeOverrides,
    yPercent,
    setCurrentTheme,
    updateThemeOverride,
    setYPercent,
  } = usePlayer();
  const [showDetails, setShowDetails] = useState(false);

  const handleThemeSelect = (themeName: string) => {
    setCurrentTheme(themeName);
    const theme = PRESET_THEMES[themeName];
    updateThemeOverride("textColor", theme.textColor);
    updateThemeOverride("highlightColor", theme.highlightColor);
    updateThemeOverride("fontSize", theme.fontSize);
  };

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold mb-3 block">Themes</Label>
        <div className="grid grid-cols-2 gap-2">
          {Object.keys(PRESET_THEMES).map((themeName) => (
            <Button
              key={themeName}
              variant={currentTheme === themeName ? "default" : "secondary"}
              onClick={() => handleThemeSelect(themeName)}
              className="h-12 font-bold"
            >
              {themeName}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full justify-between"
        >
          <span>Edit theme: {currentTheme}</span>
          {showDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {showDetails && (
          <div className="mt-4 space-y-6 p-4 bg-secondary/50 rounded-lg">
            <div>
              <Label className="text-sm mb-2 block">Text Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeOverrides.textColor}
                  onChange={(e) => updateThemeOverride("textColor", e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={themeOverrides.textColor}
                  onChange={(e) => updateThemeOverride("textColor", e.target.value)}
                  className="flex-1 bg-input px-3 py-2 rounded text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">Highlight Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={themeOverrides.highlightColor}
                  onChange={(e) => updateThemeOverride("highlightColor", e.target.value)}
                  className="w-12 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={themeOverrides.highlightColor}
                  onChange={(e) => updateThemeOverride("highlightColor", e.target.value)}
                  className="flex-1 bg-input px-3 py-2 rounded text-sm font-mono"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm mb-2 block">
                Font Size: {themeOverrides.fontSize}px
              </Label>
              <Slider
                value={[themeOverrides.fontSize || 85]}
                min={40}
                max={140}
                step={1}
                onValueChange={(v) => updateThemeOverride("fontSize", v[0])}
              />
            </div>
          </div>
        )}
      </div>

      <div>
        <Label className="text-sm mb-2 block">Position Y: {yPercent}%</Label>
        <Slider
          value={[yPercent]}
          min={1}
          max={80}
          step={1}
          onValueChange={(v) => setYPercent(v[0])}
        />
      </div>
    </div>
  );
};
