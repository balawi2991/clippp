import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, GripVertical, Trash2, Plus } from "lucide-react";
import { usePlayer } from "@/contexts/PlayerContext";
import { CaptionBlock } from "@/types/caption";

export const CaptionsTab: React.FC = () => {
  const { captions, addCaption, updateCaption, deleteCaption } = usePlayer();

  const handleTimeChange = (id: string, field: "start" | "end", value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateCaption(id, { [field]: numValue });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Caption Blocks</h3>
        <Button onClick={addCaption} size="sm" variant="default">
          <Plus className="h-4 w-4 mr-1" />
          Add Caption
        </Button>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
        {captions.map((caption, index) => (
          <CaptionBlockRow
            key={caption.id}
            caption={caption}
            index={index}
            onUpdate={updateCaption}
            onDelete={deleteCaption}
            onTimeChange={handleTimeChange}
          />
        ))}
      </div>

      {captions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No captions yet. Click "Add Caption" to get started.
        </div>
      )}
    </div>
  );
};

interface CaptionBlockRowProps {
  caption: CaptionBlock;
  index: number;
  onUpdate: (id: string, updates: Partial<CaptionBlock>) => void;
  onDelete: (id: string) => void;
  onTimeChange: (id: string, field: "start" | "end", value: string) => void;
}

const CaptionBlockRow: React.FC<CaptionBlockRowProps> = ({
  caption,
  index,
  onUpdate,
  onDelete,
  onTimeChange,
}) => {
  return (
    <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        
        <div className="flex items-center gap-1 text-xs font-mono bg-accent px-2 py-1 rounded">
          <input
            type="number"
            step="0.01"
            value={caption.start.toFixed(2)}
            onChange={(e) => onTimeChange(caption.id, "start", e.target.value)}
            className="w-14 bg-transparent border-none outline-none"
          />
          <span>—</span>
          <input
            type="number"
            step="0.01"
            value={caption.end.toFixed(2)}
            onChange={(e) => onTimeChange(caption.id, "end", e.target.value)}
            className="w-14 bg-transparent border-none outline-none"
          />
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={() => onUpdate(caption.id, { visible: !caption.visible })}
        >
          {caption.visible !== false ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(caption.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Input
        value={caption.text}
        onChange={(e) => onUpdate(caption.id, { text: e.target.value })}
        placeholder="Caption text"
        className="text-sm"
      />
    </div>
  );
};
