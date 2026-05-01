"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { StatusBadge, PriorityBadge } from "@/components/ui/badge";
import { UserChip } from "@/components/ui/avatar";
import { ScoreRing, ConfidenceBar } from "@/components/ui/score-ring";
import { ReviewPanel } from "@/components/review/review-panel";
import { FeedbackThread } from "@/components/feedback/feedback-thread";
import { UploadPanel } from "@/components/video/upload-panel";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { TimestampIssue } from "@/types";
import {
  ArrowLeft, GitBranch, Calendar, ExternalLink, Star, MessageSquare,
  Plus, Zap, CheckCircle2
} from "lucide-react";
import Link from "next/link";

type Tab = "overview" | "ai_review" | "feedback" | "versions";

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [newFeedbackText, setNewFeedbackText] = useState("");
  const [newFeedbackPriority, setNewFeedbackPriority] = useState<"must_fix" | "nice_to_improve">("must_fix");

  const videos        = useLensStore((s) => s.videos);
  const video         = videos.find((v) => v.id === id);
  const reviews       = useLensStore((s) => s.reviews);
  const review        = reviews[id];
  const feedbackMap   = useLensStore((s) => s.feedback);
  const feedback      = feedbackMap[id] ?? [];
  const isAdmin       = useIsAdmin();
  const currentUserId = useLensStore((s) => s.currentUserId);
  const addFeedback   = useLensStore((s) => s.addFeedbackItem);
  const updateStatus  = useLensStore((s) => s.updateVideoStatus);

  if (!video) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500">Video not found.</p>
      </div>
    );
  }

  const handleConvertToFeedback = (issue: TimestampIssue, dimension: string) => {
    addFeedback({
      id: `fb_${Date.now()}`,
      videoId: id,
      aiReviewId: review?.id,
      createdBy: currentUserId,
      description: issue.description,
      timestamp: issue.timestamp,
      priority: issue.priority,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dimension,
      isFromAI: true,
      replies: [],
    });
    setTab("feedback");
  };

  const handleAddFeedback = () => {
    if (!newFeedbackText.trim()) return;
    addFeedback({
      id: `fb_${Date.now()}`,
      videoId: id,
      createdBy: currentUserId,
      description: newFeedbackText.trim(),
      priority: newFeedbackPriority,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFromAI: false,
      replies: [],
    });
    setNewFeedbackText("");
    setShowAddFeedback(false);
  };

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview",  label: "Overview" },
    { key: "ai_review", label: "AI Review", ...(review && { count: review.mustFix.length }) },
    { key: "feedback",  label: "Feedback", count: feedback.filter(f => f.status !== "done").length || undefined },
    { key: "versions",  label: "Versions" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <Header
        title={video.name}
        subtitle={`${video.campaign} · ${video.platform}`}
        actions={
          <Link href="/videos" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
            <ArrowLeft size={12} />
            Videos
          </Link>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left: video + meta */}
        <div className="w-80 shrink-0 border-r border-white/[0.07] overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Thumbnail */}
            <div className="aspect-video rounded-xl overflow-hidden bg-zinc-900">
              {video.thumbnailUrl ? (
                <img src={video.thumbnailUrl} alt={video.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">No preview</div>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <StatusBadge status={video.status} />
              {isAdmin && video.status !== "approved" && video.status !== "live" && (
                <button
                  onClick={() => updateStatus(id, "approved")}
                  className="flex items-center gap-1.5 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border border-emerald-900/40 rounded-lg px-2.5 py-1.5 transition-colors"
                >
                  <CheckCircle2 size={12} />
                  Approve
                </button>
              )}
            </div>

            {/* AI score (admin only) */}
            {isAdmin && review && (
              <div className="bg-[#18181b] border border-white/[0.07] rounded-lg p-3 space-y-3">
                <div className="flex items-center gap-3">
                  <ScoreRing score={review.overallScore} size={52} strokeWidth={5} />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500 mb-1">AI Score</p>
                    <ConfidenceBar score={review.confidenceScore} />
                  </div>
                </div>
                <div className="text-xs text-zinc-500 flex items-center justify-between">
                  <span>Taste alignment</span>
                  <span className="text-violet-400 font-medium">{review.tasteAlignment}%</span>
                </div>
              </div>
            )}

            {!isAdmin && review && video.status !== "uploaded" && video.status !== "ai_reviewed" && (
              <div className="bg-[#18181b] border border-white/[0.07] rounded-lg p-3">
                <p className="text-xs text-zinc-500">Feedback items</p>
                <p className="text-lg font-semibold text-zinc-200">{feedback.filter(f => f.status !== "done").length} open</p>
              </div>
            )}

            {/* Meta */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500">Uploaded by</span>
                <UserChip userId={video.uploadedBy} />
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Campaign</span>
                <span className="text-zinc-300">{video.campaign}</span>
              </div>
              {video.project && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Project</span>
                  <span className="text-zinc-300">{video.project}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Platform</span>
                <span className="text-zinc-300">{video.platform}</span>
              </div>
              {video.goLiveDate && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">Go Live</span>
                  <span className="text-zinc-300">{formatDate(video.goLiveDate)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-zinc-500">Version</span>
                <span className="text-zinc-300 flex items-center gap-1">
                  <GitBranch size={11} /> V{video.currentVersion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Last updated</span>
                <span className="text-zinc-300">{formatRelativeTime(video.updatedAt)}</span>
              </div>
            </div>

            {/* Pre-upload check (execution team) */}
            {!isAdmin && (
              <button className="w-full flex items-center justify-center gap-2 text-sm font-medium text-violet-300 bg-violet-950/30 border border-violet-800/40 rounded-lg py-2.5 hover:bg-violet-950/50 transition-colors">
                <Zap size={14} />
                Pre-upload Check
              </button>
            )}
          </div>
        </div>

        {/* Right: tabs */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab bar */}
          <div className="flex items-center gap-0 border-b border-white/[0.07] px-4 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur-sm z-10">
            {tabs.filter(t => t.key !== "ai_review" || isAdmin).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors",
                  tab === t.key
                    ? "border-violet-500 text-violet-300"
                    : "border-transparent text-zinc-500 hover:text-zinc-300"
                )}
              >
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className="bg-amber-900/60 text-amber-300 text-[10px] px-1.5 py-0.5 rounded-full">{t.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview tab */}
            {tab === "overview" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-[#18181b] border border-white/[0.07] rounded-xl p-4">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Video Info</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {video.name} is a {video.durationSeconds ? `${Math.floor(video.durationSeconds / 60)}:${String(video.durationSeconds % 60).padStart(2, "0")} ` : ""}
                    {video.platform} video for the <span className="text-violet-300">{video.campaign}</span> campaign
                    {video.project ? `, part of the ${video.project} project` : ""}.
                  </p>
                </div>
                {video.tags && video.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {video.tags.map((tag) => (
                      <span key={tag} className="text-[11px] text-zinc-500 bg-zinc-800 border border-white/[0.06] rounded-full px-2.5 py-1">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                {isAdmin && !review && (
                  <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4 flex items-center gap-3">
                    <Star size={16} className="text-amber-400 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-300">AI Review Pending</p>
                      <p className="text-xs text-zinc-500 mt-0.5">This video hasn't been reviewed yet. Trigger review from the AI Reviews page.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI Review tab */}
            {tab === "ai_review" && isAdmin && (
              <>
                {review ? (
                  <ReviewPanel review={review} onConvertToFeedback={handleConvertToFeedback} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <Star size={32} className="text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-400">No AI review yet</p>
                    <p className="text-xs text-zinc-600 mt-1">Trigger from the AI Reviews page</p>
                  </div>
                )}
              </>
            )}

            {/* Feedback tab */}
            {tab === "feedback" && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-zinc-500">{feedback.length} item{feedback.length !== 1 ? "s" : ""}</p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddFeedback(!showAddFeedback)}
                      className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-950/30 border border-violet-800/40 rounded-lg px-3 py-1.5 hover:bg-violet-950/50 transition-colors"
                    >
                      <Plus size={12} />
                      Add Feedback
                    </button>
                  )}
                </div>

                {showAddFeedback && (
                  <div className="bg-[#18181b] border border-white/[0.09] rounded-xl p-4 space-y-3">
                    <textarea
                      value={newFeedbackText}
                      onChange={(e) => setNewFeedbackText(e.target.value)}
                      placeholder="Describe the feedback..."
                      rows={3}
                      className="w-full bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-violet-600/50 resize-none"
                    />
                    <div className="flex items-center gap-3">
                      <select
                        value={newFeedbackPriority}
                        onChange={(e) => setNewFeedbackPriority(e.target.value as "must_fix" | "nice_to_improve")}
                        className="bg-[#111113] border border-white/[0.07] rounded-lg px-3 py-1.5 text-xs text-zinc-300 outline-none"
                      >
                        <option value="must_fix">Must Fix</option>
                        <option value="nice_to_improve">Nice to Improve</option>
                      </select>
                      <button
                        onClick={handleAddFeedback}
                        className="ml-auto text-xs font-medium text-white bg-violet-600 hover:bg-violet-700 rounded-lg px-4 py-1.5 transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  </div>
                )}

                {feedback.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageSquare size={28} className="text-zinc-700 mb-3" />
                    <p className="text-sm text-zinc-400">No feedback yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {feedback
                      .sort((a, b) => {
                        if (a.priority === "must_fix" && b.priority !== "must_fix") return -1;
                        if (b.priority === "must_fix" && a.priority !== "must_fix") return 1;
                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                      })
                      .map((item) => (
                        <FeedbackThread key={item.id} item={item} videoId={id} />
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Versions tab */}
            {tab === "versions" && (
              <div className="space-y-4 animate-fade-in">
                {/* Upload new version (execution team) */}
                {!isAdmin && video.status === "in_revision" && (
                  <div className="bg-[#18181b] border border-white/[0.09] rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-zinc-200 mb-4">
                      Upload V{video.currentVersion + 1}
                    </h3>
                    <UploadPanel existingVideo={video} onSuccess={() => setTab("overview")} />
                  </div>
                )}

                {[...video.versions].reverse().map((v) => (
                  <div key={v.id} className={cn(
                    "bg-[#18181b] border rounded-xl p-4 flex items-center gap-4",
                    v.version === video.currentVersion
                      ? "border-violet-800/50"
                      : "border-white/[0.07]"
                  )}>
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-zinc-300">V{v.version}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-200">Version {v.version}</span>
                        {v.version === video.currentVersion && (
                          <span className="text-[10px] font-medium text-violet-300 bg-violet-950/50 border border-violet-800/40 rounded px-1.5 py-0.5">Current</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                        <UserChip userId={v.uploadedBy} />
                        <span>{formatDate(v.uploadedAt)}</span>
                        {v.sizeBytes && <span>{(v.sizeBytes / 1e6).toFixed(0)} MB</span>}
                      </div>
                    </div>
                    <a href={v.driveUrl} className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors">
                      <ExternalLink size={11} />
                      Drive
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
