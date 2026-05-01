"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { ReviewPanel } from "@/components/review/review-panel";
import { StatusBadge } from "@/components/ui/badge";
import { ScoreRing, ConfidenceBar } from "@/components/ui/score-ring";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";
import { Star, Zap, AlertCircle } from "lucide-react";

export default function ReviewPage() {
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const videos    = useLensStore((s) => s.videos);
  const reviews   = useLensStore((s) => s.reviews);
  const isAdmin   = useIsAdmin();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500 text-sm">AI Reviews are visible to admin reviewers only.</p>
      </div>
    );
  }

  const videosWithReviews = videos.filter((v) => reviews[v.id]);
  const pending           = videos.filter((v) => !reviews[v.id] && v.status === "uploaded");
  const selectedReview    = selectedVideoId ? reviews[selectedVideoId] : null;
  const selectedVideo     = selectedVideoId ? videos.find((v) => v.id === selectedVideoId) : null;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="AI Reviews"
        subtitle={`${videosWithReviews.length} reviewed · ${pending.length} pending`}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: video list */}
        <div className="w-72 shrink-0 border-r border-white/[0.07] overflow-y-auto">
          {pending.length > 0 && (
            <div className="p-3 border-b border-white/[0.07]">
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Pending Review</p>
              {pending.map((video) => (
                <div key={video.id} className="flex items-center gap-2 px-2 py-2 rounded-lg group">
                  <div className="w-10 h-7 rounded bg-zinc-900 overflow-hidden shrink-0">
                    {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-60" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-400 truncate">{video.name}</p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Zap size={12} className="text-violet-400" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">Reviewed</p>
            {videosWithReviews.map((video) => {
              const review = reviews[video.id];
              const isSelected = selectedVideoId === video.id;
              return (
                <button
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2.5 rounded-lg transition-colors text-left",
                    isSelected ? "bg-violet-600/15" : "hover:bg-white/[0.03]"
                  )}
                >
                  <div className="w-10 h-7 rounded bg-zinc-900 overflow-hidden shrink-0">
                    {video.thumbnailUrl && <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-xs truncate", isSelected ? "text-violet-200" : "text-zinc-300")}>{video.name}</p>
                    <p className="text-[10px] text-zinc-600">{formatRelativeTime(review.generatedAt)}</p>
                  </div>
                  <ScoreRing score={review.overallScore} size={30} strokeWidth={3} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: review detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedReview && selectedVideo ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100">{selectedVideo.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedVideo.status} />
                    <span className="text-xs text-zinc-500">V{selectedVideo.currentVersion}</span>
                  </div>
                </div>
                <Link
                  href={`/videos/${selectedVideo.id}`}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  View video →
                </Link>
              </div>
              <ReviewPanel review={selectedReview} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <Star size={40} className="text-zinc-700 mb-4" />
              <p className="text-sm text-zinc-400 mb-2">Select a video to see its AI review</p>
              <p className="text-xs text-zinc-600 max-w-xs">
                Reviews are generated using GPT-4o Vision + your active Taste Profile (v{useLensStore.getState().tasteProfile.version})
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
