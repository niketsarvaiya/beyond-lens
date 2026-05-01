"use client";

import { Header } from "@/components/layout/header";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { ScoreRing } from "@/components/ui/score-ring";
import { StatusBadge } from "@/components/ui/badge";
import { UserChip } from "@/components/ui/avatar";
import { MOCK_DASHBOARD_STATS } from "@/lib/mock-data";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import {
  Video, Star, MessageSquare, TrendingUp, AlertTriangle, Brain, ChevronRight
} from "lucide-react";

function StatCard({ label, value, sub, icon: Icon, color = "text-zinc-300" }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color?: string;
}) {
  return (
    <div className="bg-[#18181b] border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">{label}</p>
        <Icon size={14} className="text-zinc-600" />
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const videos  = useLensStore((s) => s.videos);
  const isAdmin = useIsAdmin();
  const reviews = useLensStore((s) => s.reviews);
  const stats   = MOCK_DASHBOARD_STATS;

  const recentVideos = [...videos]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Dashboard" subtitle="Beyond Alliance Content Operations" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Videos" value={stats.totalVideos} icon={Video} sub="across all campaigns" />
          <StatCard label="Pending Review" value={stats.pendingReview} icon={Star} color="text-amber-400" sub="awaiting review" />
          <StatCard label="In Revision" value={stats.inRevision} icon={MessageSquare} color="text-blue-400" sub="team working" />
          <StatCard label="Approved This Month" value={stats.approvedThisMonth} icon={TrendingUp} color="text-emerald-400" sub="ready to schedule" />
        </div>

        {isAdmin && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Avg AI Score" value={stats.avgAIScore.toFixed(1)} icon={Brain} color="text-violet-400" sub="active reviews" />
            <StatCard label="AI Confidence" value={`${stats.avgConfidence}%`} icon={Star} color="text-blue-400" sub="taste alignment" />
            <div className="col-span-2 bg-[#18181b] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-zinc-500">Taste Alignment Trend</p>
                <span className="text-xs text-emerald-400">+26pts in 60 days</span>
              </div>
              <div className="flex items-end gap-1.5 h-12">
                {stats.tasteAlignmentTrend.map((point, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full rounded-sm bg-violet-600/50 hover:bg-violet-500/70 transition-colors cursor-default"
                      style={{ height: `${(point.score / 100) * 48}px` }}
                      title={`${point.date}: ${point.score}%`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
                <span>Mar 1</span><span>May 1</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent videos */}
          <div className="lg:col-span-2 bg-[#18181b] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07]">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Activity</h2>
              <Link href="/videos" className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                All videos <ChevronRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {recentVideos.map((video) => {
                const review = reviews[video.id];
                return (
                  <Link
                    key={video.id}
                    href={`/videos/${video.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="w-14 h-10 rounded overflow-hidden shrink-0 bg-zinc-900">
                      {video.thumbnailUrl && (
                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200 truncate">{video.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StatusBadge status={video.status} />
                        <span className="text-[10px] text-zinc-600">{formatRelativeTime(video.updatedAt)}</span>
                      </div>
                    </div>
                    {isAdmin && review && (
                      <ScoreRing score={review.overallScore} size={36} strokeWidth={3} />
                    )}
                    <ChevronRight size={12} className="text-zinc-600 group-hover:text-zinc-400 shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Common issues (admin only) */}
          {isAdmin && (
            <div className="bg-[#18181b] border border-white/[0.07] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.07]">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-400" />
                  <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recurring Issues</h2>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {stats.commonIssues.map((issue, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-zinc-300">{issue.issue}</span>
                      <span className="text-zinc-500">{issue.count}×</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-600/60"
                        style={{ width: `${(issue.count / stats.commonIssues[0].count) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 pb-4 pt-2 border-t border-white/[0.05]">
                <p className="text-xs text-zinc-500 leading-relaxed">
                  <span className="text-amber-400 font-medium">Subtitle readability</span> flagged in 8 of last 12 videos. Add to pre-upload checklist.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Team performance */}
        {isAdmin && (
          <div className="bg-[#18181b] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/[0.07]">
              <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Team Performance</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {stats.teamPerformance.map((row) => (
                <div key={row.userId} className="flex items-center gap-4 px-4 py-3">
                  <UserChip userId={row.userId} />
                  <div className="flex-1 grid grid-cols-2 gap-4 ml-2">
                    <div>
                      <p className="text-[10px] text-zinc-600">Submissions</p>
                      <p className="text-sm font-medium text-zinc-200">{row.submitted}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-600">Avg Revisions</p>
                      <p className={`text-sm font-medium ${row.avgRevisions > 2 ? "text-amber-400" : "text-emerald-400"}`}>
                        {row.avgRevisions.toFixed(1)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
