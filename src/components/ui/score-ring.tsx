"use client";

import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;       // 0–10
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
}

function scoreColor(score: number) {
  if (score >= 8.5) return "#34d399";
  if (score >= 7)   return "#60a5fa";
  if (score >= 5.5) return "#fbbf24";
  return "#f87171";
}

export function ScoreRing({ score, size = 64, strokeWidth = 5, className, showLabel = true }: ScoreRingProps) {
  const radius  = (size - strokeWidth) / 2;
  const circ    = 2 * Math.PI * radius;
  const offset  = circ - (score / 10) * circ;
  const color   = scoreColor(score);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      {showLabel && (
        <span
          className="absolute text-sm font-semibold tabular-nums"
          style={{ color }}
        >
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}

export function ConfidenceBar({ score, className }: { score: number; className?: string }) {
  const color = score >= 80 ? "#34d399" : score >= 55 ? "#fbbf24" : "#f87171";
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">AI Confidence</span>
        <span className="font-medium tabular-nums" style={{ color }}>{score}%</span>
      </div>
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  );
}
