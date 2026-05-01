"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { FeedbackThread } from "@/components/feedback/feedback-thread";
import { StatusBadge } from "@/components/ui/badge";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { cn } from "@/lib/utils";
import type { FeedbackStatus } from "@/types";
import Link from "next/link";
import { ChevronRight, MessageSquare } from "lucide-react";

const FILTER_OPTIONS: { key: FeedbackStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" },
  { key: "clarification_needed", label: "Needs Clarification" },
];

export default function FeedbackPage() {
  const [filter, setFilter] = useState<FeedbackStatus | "all">("all");

  const videos   = useLensStore((s) => s.videos);
  const feedback = useLensStore((s) => s.feedback);
  const isAdmin  = useIsAdmin();
  const currentUserId = useLensStore((s) => s.currentUserId);

  // Flatten all feedback across all videos
  const allItems = videos.flatMap((video) => {
    const items = feedback[video.id] ?? [];
    return items.map((item) => ({ ...item, video }));
  });

  const filtered = allItems.filter((item) => {
    if (filter !== "all" && item.status !== filter) return false;
    // Execution team only sees feedback for their videos
    if (!isAdmin && item.video.uploadedBy !== currentUserId) return false;
    return true;
  });

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    const key = item.videoId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const totalOpen = allItems.filter((i) => i.status !== "done").length;

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title="Feedback"
        subtitle={`${totalOpen} open items across ${Object.keys(grouped).length} videos`}
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Filter bar */}
        <div className="flex items-center gap-1 bg-[#18181b] border border-white/[0.07] rounded-lg p-1 w-fit">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={cn(
                "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                filter === opt.key
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Feedback grouped by video */}
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <MessageSquare size={32} className="text-zinc-700 mb-3" />
            <p className="text-sm text-zinc-400">No feedback items</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([videoId, items]) => {
              const video = items[0].video;
              return (
                <section key={videoId}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-7 rounded overflow-hidden bg-zinc-900 shrink-0">
                      {video.thumbnailUrl && (
                        <img src={video.thumbnailUrl} alt="" className="w-full h-full object-cover opacity-80" />
                      )}
                    </div>
                    <Link
                      href={`/videos/${videoId}`}
                      className="flex items-center gap-1.5 text-sm font-medium text-zinc-200 hover:text-white transition-colors"
                    >
                      {video.name}
                      <ChevronRight size={12} className="text-zinc-600" />
                    </Link>
                    <StatusBadge status={video.status} />
                  </div>
                  <div className="space-y-3">
                    {items
                      .sort((a, b) => (a.priority === "must_fix" ? -1 : 1))
                      .map((item) => (
                        <FeedbackThread key={item.id} item={item} videoId={videoId} />
                      ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
