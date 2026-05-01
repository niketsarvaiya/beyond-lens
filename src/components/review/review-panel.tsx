"use client";

import { ScoreRing, ConfidenceBar } from "@/components/ui/score-ring";
import { PriorityBadge } from "@/components/ui/badge";
import { REVIEW_DIMENSIONS } from "@/lib/constants";
import type { AIReview } from "@/types";
import { cn } from "@/lib/utils";
import { AlertCircle, Lightbulb, Brain } from "lucide-react";

interface ReviewPanelProps {
  review: AIReview;
  onConvertToFeedback?: (issue: AIReview["mustFix"][0], dimension: string) => void;
}

function dimensionScore(score: number) {
  if (score >= 8.5) return "text-emerald-400";
  if (score >= 7)   return "text-blue-400";
  if (score >= 5.5) return "text-amber-400";
  return "text-red-400";
}

export function ReviewPanel({ review, onConvertToFeedback }: ReviewPanelProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header scores */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#18181b] border border-white/[0.07] rounded-xl p-4 flex flex-col items-center gap-2">
          <ScoreRing score={review.overallScore} size={72} strokeWidth={6} />
          <p className="text-xs text-zinc-500">Overall Score</p>
        </div>
        <div className="bg-[#18181b] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-3 justify-center">
          <ConfidenceBar score={review.confidenceScore} />
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500">Taste Alignment</span>
              <span className="text-violet-400 font-medium">{review.tasteAlignment}%</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${review.tasteAlignment}%` }}
              />
            </div>
          </div>
        </div>
        <div className="bg-[#18181b] border border-white/[0.07] rounded-xl p-4 flex flex-col gap-1.5 justify-center">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Summary</p>
          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-6">{review.summary}</p>
          <p className="text-[10px] text-zinc-600 mt-auto">Model: {review.modelVersion}</p>
        </div>
      </div>

      {/* Must Fix */}
      {review.mustFix.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-red-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Must Fix ({review.mustFix.length})</h3>
          </div>
          <div className="space-y-2">
            {review.mustFix.map((issue, i) => (
              <div key={i} className="bg-red-950/20 border border-red-900/40 rounded-lg p-3.5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-red-400 bg-red-950/50 px-1.5 py-0.5 rounded">{issue.timestamp}</span>
                      <PriorityBadge priority="must_fix" />
                    </div>
                    <p className="text-sm text-zinc-200">{issue.description}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-zinc-500 mt-1">→ {issue.suggestion}</p>
                    )}
                  </div>
                  {onConvertToFeedback && (
                    <button
                      onClick={() => onConvertToFeedback(issue, "general")}
                      className="text-[11px] text-zinc-500 hover:text-violet-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      + Feedback
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Nice to Improve */}
      {review.niceToImprove.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={14} className="text-amber-400" />
            <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Nice to Improve ({review.niceToImprove.length})</h3>
          </div>
          <div className="space-y-2">
            {review.niceToImprove.map((issue, i) => (
              <div key={i} className="bg-amber-950/15 border border-amber-900/30 rounded-lg p-3.5 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded">{issue.timestamp}</span>
                      <PriorityBadge priority="nice_to_improve" />
                    </div>
                    <p className="text-sm text-zinc-300">{issue.description}</p>
                    {issue.suggestion && (
                      <p className="text-xs text-zinc-500 mt-1">→ {issue.suggestion}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dimension breakdown */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Brain size={14} className="text-violet-400" />
          <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Dimension Breakdown</h3>
        </div>
        <div className="space-y-2">
          {REVIEW_DIMENSIONS.map(({ key, label, icon }) => {
            const dim = review.dimensions[key as keyof typeof review.dimensions];
            if (!dim) return null;
            return (
              <div key={key} className="bg-[#18181b] border border-white/[0.06] rounded-lg p-3 hover:border-white/[0.1] transition-colors">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-sm">{icon}</span>
                    <span className="text-xs font-medium text-zinc-300">{label}</span>
                    {dim.issues.length > 0 && (
                      <span className="text-[10px] text-red-400">{dim.issues.length} issue{dim.issues.length > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  <span className={cn("text-sm font-semibold tabular-nums", dimensionScore(dim.score))}>
                    {dim.score.toFixed(1)}
                  </span>
                </div>
                <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(dim.score / 10) * 100}%`,
                      background: dim.score >= 8.5 ? "#34d399" : dim.score >= 7 ? "#60a5fa" : dim.score >= 5.5 ? "#fbbf24" : "#f87171",
                    }}
                  />
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">{dim.reasoning}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
