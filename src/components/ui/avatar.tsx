import { cn, getInitials } from "@/lib/utils";
import { USERS } from "@/lib/constants";
import type { UserId } from "@/types";

interface AvatarProps {
  userId: UserId;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = { sm: "w-6 h-6 text-[10px]", md: "w-8 h-8 text-xs", lg: "w-10 h-10 text-sm" };

export function UserAvatar({ userId, size = "md", className }: AvatarProps) {
  const user = USERS.find((u) => u.id === userId);
  if (!user) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold shrink-0",
        sizeMap[size],
        className
      )}
      style={{ background: user.color + "30", color: user.color, border: `1px solid ${user.color}40` }}
      title={user.name}
    >
      {getInitials(user.name)}
    </span>
  );
}

export function UserChip({ userId }: { userId: UserId }) {
  const user = USERS.find((u) => u.id === userId);
  if (!user) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <UserAvatar userId={userId} size="sm" />
      <span className="text-sm text-zinc-300">{user.name}</span>
    </span>
  );
}
