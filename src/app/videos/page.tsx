"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { VideoCard } from "@/components/video/video-card";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { VIDEO_STATUSES, STATUS_LABELS, PLATFORMS, CAMPAIGNS } from "@/lib/constants";
import type { VideoStatus, Platform } from "@/types";
import { cn } from "@/lib/utils";
import { Search, LayoutGrid, List, Plus, X } from "lucide-react";
import { UploadPanel } from "@/components/video/upload-panel";

export default function VideosPage() {
  const videos  = useLensStore((s) => s.videos);
  const isAdmin = useIsAdmin();
  const [showUpload, setShowUpload] = useState(false);

  const [search,   setSearch]   = useState("");
  const [status,   setStatus]   = useState<VideoStatus | "all">("all");
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [view,     setView]     = useState<"grid" | "list">("grid");

  const filtered = videos.filter((v) => {
    if (search && !v.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && v.status !== status) return false;
    if (platform !== "all" && v.platform !== platform) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Videos"
        subtitle={`${filtered.length} of ${videos.length} videos`}
        actions={
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors",
              showUpload
                ? "bg-zinc-700 text-zinc-200"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            )}
          >
            {showUpload ? <><X size={12} /> Cancel</> : <><Plus size={12} /> Upload Video</>}
          </button>
        }
      />

      <div className="p-6 space-y-4 animate-fade-in">
        {/* Upload panel */}
        {showUpload && (
          <div className="bg-[#18181b] border border-white/[0.09] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-zinc-200 mb-4">Upload New Video</h3>
            <UploadPanel onSuccess={() => setShowUpload(false)} />
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-52">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search videos..."
              className="w-full bg-[#18181b] border border-white/[0.07] rounded-lg pl-8 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-600/50 transition-colors"
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as VideoStatus | "all")}
            className="bg-[#18181b] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-600/50 transition-colors"
          >
            <option value="all">All Statuses</option>
            {VIDEO_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>

          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as Platform | "all")}
            className="bg-[#18181b] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-300 outline-none focus:border-violet-600/50 transition-colors"
          >
            <option value="all">All Platforms</option>
            {PLATFORMS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>

          <div className="flex items-center gap-1 bg-[#18181b] border border-white/[0.07] rounded-lg p-1 ml-auto">
            <button
              onClick={() => setView("grid")}
              className={cn("p-1.5 rounded transition-colors", view === "grid" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300")}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-1.5 rounded transition-colors", view === "list" ? "bg-zinc-700 text-zinc-200" : "text-zinc-500 hover:text-zinc-300")}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-zinc-500 text-sm">No videos match your filters.</p>
          </div>
        ) : (
          <div className={cn(
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              : "space-y-2"
          )}>
            {filtered.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
