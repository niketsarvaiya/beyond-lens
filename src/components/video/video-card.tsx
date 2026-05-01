"use client";

import Link from "next/link";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/ui/avatar";
import { ScoreRing } from "@/components/ui/score-ring";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import type { Video } from "@/types";
import { Clock, GitBranch, Calendar } from "lucide-react";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const review      = useLensStore((s) => s.reviews[video.id]);
  const isAdmin     = useIsAdmin();
  const feedbackMap = useLensStore((s) => s.feedback);
  const feedback    = feedbackMap[video.id] ?? [];
  const openFeedback = feedback.filter((f) => f.status !== "done").length;

  return (
    <Link
      href={`/videos/${video.id}`}
      className="group flex flex-col bg-[#18181b] border border-white/[0.07] rounded-xl overflow-hidden hover:border-white/[0.14] transition-all duration-150 hover:-translate-y-0.5"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-zinc-900 overflow-hidden">
        {video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.name}
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-zinc-600 text-xs">No thumbnail</span>
          </div>
        )}

        {/* Platform chip */}
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-black/60 text-zinc-300 backdrop-blur-sm">
          {video.platform}
        </span>

        {/* AI Score overlay (admin only) */}
        {isAdmin && review && (
          <div className="absolute bottom-2 right-2">
            <ScoreRing score={review.overallScore} size={40} strokeWidth={4} />
          </div>
        )}

        {/* Duration */}
        {video.durationSeconds && (
          <span className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm">
            {Math.floor(video.durationSeconds / 60)}:{String(video.durationSeconds % 60).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        <div>
          <p className="text-sm font-medium text-zinc-100 leading-snug line-clamp-2">{video.name}</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{video.campaign}</p>
        </div>

        <StatusBadge status={video.status} />

        <div className="flex items-center justify-between text-[11px] text-zinc-500 mt-auto pt-1 border-t border-white/[0.05]">
          <div className="flex items-center gap-3">
            <UserAvatar userId={video.uploadedBy} size="sm" />
            <span className="flex items-center gap-1">
              <GitBranch size={10} />
              V{video.currentVersion}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {openFeedback > 0 && (
              <span className="text-amber-500">
                {openFeedback} open
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatRelativeTime(video.updatedAt)}
            </span>
          </div>
        </div>

        {video.goLiveDate && (
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
            <Calendar size={10} />
            Go live {formatDate(video.goLiveDate)}
          </div>
        )}
      </div>
    </Link>
  );
}
