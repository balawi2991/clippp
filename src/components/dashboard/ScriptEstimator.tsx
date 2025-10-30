import React, { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ScriptEstimatorProps {
  script: string;
  targetDuration: number;
}

/**
 * Shows estimated duration for the script
 */
export const ScriptEstimator: React.FC<ScriptEstimatorProps> = ({ script, targetDuration }) => {
  const [estimation, setEstimation] = useState<{
    wordCount: number;
    estimatedDuration: number;
    estimatedRange: { min: number; max: number };
  } | null>(null);

  useEffect(() => {
    if (!script.trim()) {
      setEstimation(null);
      return;
    }

    // Debounce estimation
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:3001/api/scripts/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script })
        });

        if (response.ok) {
          const data = await response.json();
          setEstimation(data);
        }
      } catch (error) {
        console.error('Estimation error:', error);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [script]);

  if (!estimation) return null;

  const isWithinTarget = 
    estimation.estimatedDuration >= targetDuration * 0.9 &&
    estimation.estimatedDuration <= targetDuration * 1.2;

  return (
    <div className="flex items-center gap-2 text-sm">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <span className="text-muted-foreground">
        {estimation.wordCount} words ≈
      </span>
      <span className={isWithinTarget ? "text-green-600 font-medium" : "text-orange-600 font-medium"}>
        {estimation.estimatedRange.min}-{estimation.estimatedRange.max}s
      </span>
      {!isWithinTarget && (
        <span className="text-xs text-muted-foreground">
          (target: {targetDuration}s)
        </span>
      )}
    </div>
  );
};
