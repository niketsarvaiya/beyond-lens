"use client";

import { useState } from "react";
import { useLensStore, useIsAdmin } from "@/store/lens-store";
import { UserAvatar, UserChip } from "@/components/ui/avatar";
import { PriorityBadge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { FeedbackItem, FeedbackStatus } from "@/types";
import { MessageSquare, CheckCircle2, AlertCircle, HelpCircle, Loader2 } from "lucide-react";

const STATUS_ICONS: Record<FeedbackStatus, React.ElementType> = {
  pending:              AlertCircle,
  in_progress:          Loader2,
  done:                 CheckCircle2,
  clarification_needed: HelpCircle,
};

const STATUS_COLORS: Record<FeedbackStatus, string> = {
  pending:              "text-zinc-500",
  in_progress:          "text-blue-400",
  done:                 "text-emerald-400",
  clarification_needed: "text-amber-400",
};

interface FeedbackThreadProps {
  item: FeedbackItem;
  videoId: string;
}

export function FeedbackThread({ item, videoId }: FeedbackThreadProps) {
  const [replyText, setReplyText]     = useState("");
  const [expanded, setExpanded]       = useState(true);
  const currentUserId   = useLensStore((s) => s.currentUserId);
  const isAdmin         = useIsAdmin();
  const updateStatus    = useLensStore((s) => s.updateFeedbackStatus);
  const addReply        = useLensStore((s) => s.addReply);

  const StatusIcon = STATUS_ICONS[item.status];

  const handleReply = () => {
    if (!replyText.trim()) return;
    addReply(videoId, item.id, {
      id: `reply_${Date.now()}`,
      feedbackId: item.id,
      authorId: currentUserId,
      message: replyText.trim(),
      createdAt: new Date().toISOString(),
    });
    setReplyText("");
  };

  const nextStatus = (current: FeedbackStatus): FeedbackStatus => {
    const flow: FeedbackStatus[] = ["pending", "in_progress", "done"];
    const idx = flow.indexOf(current);
    return flow[Math.min(idx + 1, flow.length - 1)];
  };

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-colors",
      item.priority === "must_fix"
        ? "border-red-900/40 bg-red-950/10"
        : "border-amber-900/30 bg-amber-950/8",
      item.status === "done" && "opacity-60"
    )}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <UserAvatar userId={item.createdBy} size="md" className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-medium text-zinc-300">
                {item.createdBy.charAt(0).toUpperCase() + item.createdBy.slice(1)}
              </span>
              <span className="text-[10px] text-zinc-600">{formatRelativeTime(item.createdAt)}</span>
              {item.timestamp && (
                <span className="font-mono text-[10px] text-violet-400 bg-violet-950/40 px-1.5 py-0.5 rounded">
                  {item.timestamp}
                </span>
              )}
              <PriorityBadge priority={item.priority} />
              {item.isFromAI && (
                <span className="text-[10px] text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5">AI</span>
              )}
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed">{item.description}</p>
          </div>

          {/* Status toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <StatusIcon size={14} className={cn(STATUS_COLORS[item.status], item.status === "in_progress" && "animate-spin")} />
            {item.status !== "done" && (
              <button
                onClick={() => updateStatus(videoId, item.id, nextStatus(item.status))}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors bg-zinc-800/80 border border-white/[0.07] rounded px-2 py-1"
              >
                {item.status === "pending" ? "Start" : "Done"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Replies */}
      {item.replies.length > 0 && (
        <div className="border-t border-white/[0.05] bg-black/20">
          {item.replies.map((reply) => (
            <div key={reply.id} className="flex gap-3 px-4 py-3 border-b border-white/[0.04] last:border-0">
              <UserAvatar userId={reply.authorId} size="sm" className="shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-medium text-zinc-400">
                    {reply.authorId.charAt(0).toUpperCase() + reply.authorId.slice(1)}
                  </span>
                  <span className="text-[10px] text-zinc-600">{formatRelativeTime(reply.createdAt)}</span>
                </div>
                <p className="text-xs text-zinc-300">{reply.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply input */}
      <div className="border-t border-white/[0.05] p-3 flex gap-2">
        <UserAvatar userId={currentUserId} size="sm" className="shrink-0 mt-1" />
        <div className="flex-1 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
            placeholder="Reply..."
            className="flex-1 bg-transparent text-xs text-zinc-300 placeholder-zinc-600 outline-none"
          />
          {replyText.trim() && (
            <button
              onClick={handleReply}
              className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors font-medium shrink-0"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
