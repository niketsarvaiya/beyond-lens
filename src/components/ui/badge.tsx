import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";
import type { VideoStatus } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase",
        variant === "default" && "bg-zinc-800 text-zinc-300",
        variant === "outline" && "border border-zinc-700 text-zinc-400",
        variant === "ghost" && "text-zinc-400",
        className
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: VideoStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide",
        STATUS_COLORS[status]
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: "must_fix" | "nice_to_improve" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase",
        priority === "must_fix"
          ? "bg-red-900/50 text-red-400 border border-red-800/60"
          : "bg-amber-900/40 text-amber-400 border border-amber-800/40"
      )}
    >
      {priority === "must_fix" ? "Must Fix" : "Nice to Improve"}
    </span>
  );
}
