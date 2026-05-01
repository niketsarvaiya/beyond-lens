"use client";

import { Header } from "@/components/layout/header";
import { TasteProfilePanel } from "@/components/learning/taste-profile-panel";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { MOCK_LEARNING_ENTRIES } from "@/lib/mock-data";
import { detectRecurringPatterns } from "@/lib/ai/learning-pipeline";
import { formatDate } from "@/lib/utils";
import { UserChip } from "@/components/ui/avatar";
import { Brain, Lightbulb, TrendingDown, TrendingUp } from "lucide-react";

export default function LearningPage() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500 text-sm">Taste Profile is visible to admin reviewers only.</p>
      </div>
    );
  }

  const patterns = detectRecurringPatterns(MOCK_LEARNING_ENTRIES);

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Taste Profile"
        subtitle="Self-learning AI model based on your review history"
      />

      <div className="p-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: taste profile */}
          <div>
            <TasteProfilePanel />
          </div>

          {/* Right: learning history + patterns */}
          <div className="space-y-6">
            {/* Recurring patterns */}
            {patterns.length > 0 && (
              <div className="bg-[#18181b] border border-amber-900/30 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
                  <Lightbulb size={13} className="text-amber-400" />
                  <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recurring Patterns</h2>
                </div>
                <div className="p-4 space-y-3">
                  {patterns.map((p, i) => (
                    <div key={i} className="bg-amber-950/15 border border-amber-900/30 rounded-lg p-3.5">
                      <p className="text-xs text-zinc-300 leading-relaxed">{p.insight}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {p.dimension.replace(/_/g, " ")} · {p.occurrences} occurrences
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Learning history */}
            <div className="bg-[#18181b] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.07] flex items-center gap-2">
                <Brain size={13} className="text-violet-400" />
                <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Learning History ({MOCK_LEARNING_ENTRIES.length})
                </h2>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {MOCK_LEARNING_ENTRIES.map((entry) => (
                  <div key={entry.id} className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserChip userId={entry.reviewerId} />
                      <span className="text-[11px] text-zinc-600">{formatDate(entry.createdAt)}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed mb-3">{entry.insight}</p>

                    {/* Delta breakdown */}
                    <div className="space-y-1.5">
                      {Object.entries(entry.delta)
                        .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))
                        .slice(0, 4)
                        .map(([dim, delta]) => (
                          <div key={dim} className="flex items-center gap-2 text-[11px]">
                            <span className="text-zinc-600 w-36 truncate">{dim.replace(/_/g, " ")}</span>
                            <div className="flex items-center gap-1">
                              {delta > 0 ? (
                                <TrendingUp size={10} className="text-emerald-400" />
                              ) : (
                                <TrendingDown size={10} className="text-red-400" />
                              )}
                              <span className={delta > 0 ? "text-emerald-400" : "text-red-400"}>
                                {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-zinc-700 text-[10px]">
                              AI: {entry.aiScores[dim]?.toFixed(1)} → Human: {entry.humanScores[dim]?.toFixed(1)}
                            </span>
                          </div>
                        ))}
                    </div>

                    {entry.missedIssues.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/[0.05]">
                        <p className="text-[10px] text-zinc-600 mb-1">AI missed:</p>
                        {entry.missedIssues.map((issue, i) => (
                          <p key={i} className="text-[10px] text-red-400">— {issue}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
