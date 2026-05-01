"use client";

import { useLensStore } from "@/store/lens-store";
import { REVIEW_DIMENSIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Brain, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function TasteProfilePanel() {
  const profile = useLensStore((s) => s.tasteProfile);

  const weightIcon = (w: number) => {
    if (w > 1.3) return <TrendingUp size={12} className="text-emerald-400" />;
    if (w < 0.8) return <TrendingDown size={12} className="text-red-400" />;
    return <Minus size={12} className="text-zinc-500" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-[#18181b] border border-violet-900/40 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-700/40 flex items-center justify-center">
            <Brain size={16} className="text-violet-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">Niket Taste Profile</h2>
            <p className="text-xs text-zinc-500">Version {profile.version} · {profile.totalFeedbackSamples} feedback samples</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-[11px] text-zinc-500">Last updated</p>
            <p className="text-xs text-zinc-300">{formatDate(profile.updatedAt)}</p>
          </div>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed">
          This model continuously learns from review feedback. Each time Niket reviews a video, the AI compares its assessment against the human verdict and updates dimension weights accordingly.
        </p>
      </div>

      {/* Dimension Weights */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Dimension Weights</h3>
        <div className="space-y-2">
          {REVIEW_DIMENSIONS.map(({ key, label, icon }) => {
            const weight = profile.dimensionWeights[key] ?? 1.0;
            const barWidth = Math.min(100, (weight / 2.5) * 100);
            return (
              <div key={key} className="bg-[#18181b] border border-white/[0.06] rounded-lg p-3 flex items-center gap-3">
                <span className="text-zinc-500 text-sm w-5 text-center shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-300">{label}</span>
                    <div className="flex items-center gap-1">
                      {weightIcon(weight)}
                      <span className={cn(
                        "text-xs font-semibold tabular-nums",
                        weight > 1.3 ? "text-emerald-400" : weight < 0.8 ? "text-red-400" : "text-zinc-400"
                      )}>
                        ×{weight.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        weight > 1.3 ? "bg-emerald-500" : weight < 0.8 ? "bg-red-500" : "bg-zinc-500"
                      )}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Learned Rules */}
      <section>
        <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Learned Rules</h3>
        <div className="space-y-2">
          {profile.rules
            .sort((a, b) => b.confidence - a.confidence)
            .map((rule) => (
              <div key={rule.id} className="bg-[#18181b] border border-white/[0.06] rounded-lg p-3.5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-xs text-zinc-200 leading-relaxed">{rule.rule}</span>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-zinc-500">{rule.confidence}% confidence</p>
                    <p className="text-[10px] text-zinc-600">{rule.examplesCount} examples</p>
                  </div>
                </div>
                <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500/60 transition-all duration-500"
                    style={{ width: `${rule.confidence}%` }}
                  />
                </div>
                <p className="text-[10px] text-zinc-600 mt-1.5">
                  Dimension: {rule.dimension.replace(/_/g, " ")} · Source: {rule.source} · Updated {formatDate(rule.lastUpdated)}
                </p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
