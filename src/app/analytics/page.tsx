"use client";

import { Header } from "@/components/layout/header";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { MOCK_SOCIAL_METRICS } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, Users, Eye, Heart, ExternalLink } from "lucide-react";

function MetricCard({ label, value, growth, icon: Icon }: {
  label: string;
  value: string | number;
  growth?: number;
  icon: React.ElementType;
}) {
  const isPositive = growth !== undefined && growth > 0;
  return (
    <div className="bg-[#18181b] border border-white/[0.07] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-zinc-500">{label}</p>
        <Icon size={14} className="text-zinc-600" />
      </div>
      <p className="text-2xl font-semibold tabular-nums text-zinc-100">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {growth !== undefined && (
        <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(growth)}% {isPositive ? "growth" : "decline"}
        </div>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500 text-sm">Analytics are visible to admin reviewers only.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Analytics"
        subtitle="Social performance · Last 30 days"
      />

      <div className="p-6 space-y-8 animate-fade-in">
        {/* Integration notice */}
        <div className="bg-[#18181b] border border-white/[0.07] rounded-xl p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-700/40 flex items-center justify-center shrink-0">
            <ExternalLink size={14} className="text-violet-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-200 mb-1">Connect your social accounts</p>
            <p className="text-xs text-zinc-500 leading-relaxed">
              For live data, connect via <span className="text-violet-300">Phyllo API</span> (recommended — supports both Instagram Business + LinkedIn).
              Alternatively: Instagram Graph API, LinkedIn Marketing API, or manual CSV upload.
              Currently showing <span className="text-amber-300">mock data</span>.
            </p>
          </div>
          <button className="text-xs text-violet-400 hover:text-violet-300 bg-violet-950/30 border border-violet-800/40 rounded-lg px-3 py-1.5 shrink-0 transition-colors">
            Connect
          </button>
        </div>

        {MOCK_SOCIAL_METRICS.map((metrics) => (
          <section key={metrics.platform}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${metrics.platform === "Instagram" ? "bg-pink-500" : "bg-blue-500"}`} />
                <h2 className="text-sm font-semibold text-zinc-200">{metrics.platform}</h2>
              </div>
              <p className="text-[11px] text-zinc-600">Updated {formatDate(metrics.updatedAt)}</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                label="Followers"
                value={metrics.followers.toLocaleString()}
                growth={metrics.followersGrowth}
                icon={Users}
              />
              <MetricCard
                label="Engagement Rate"
                value={`${metrics.engagementRate}%`}
                icon={Heart}
              />
              <MetricCard
                label="Total Reach"
                value={metrics.reach.toLocaleString()}
                icon={Eye}
              />
              <MetricCard
                label="Impressions"
                value={metrics.impressions.toLocaleString()}
                icon={TrendingUp}
              />
            </div>

            {/* Top posts */}
            {metrics.topPosts.length > 0 && (
              <div className="bg-[#18181b] border border-white/[0.07] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-white/[0.07]">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Top Posts</h3>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {metrics.topPosts.map((post) => (
                    <div key={post.id} className="flex items-center gap-4 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{post.caption}</p>
                        <p className="text-xs text-zinc-600 mt-0.5">{formatDate(post.postedAt)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs shrink-0">
                        <span className="text-zinc-300">{post.likes.toLocaleString()} likes</span>
                        <span className="text-zinc-500">{post.comments} comments</span>
                        <span className="text-emerald-400 font-medium">{post.engagementRate}% ER</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
