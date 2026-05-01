"use client";

import { useLensStore } from "@/store/lens-store";
import { UserAvatar } from "@/components/ui/avatar";
import { USERS } from "@/lib/constants";
import type { UserId } from "@/types";

interface HeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Header({ title, subtitle, actions }: HeaderProps) {
  const currentUserId = useLensStore((s) => s.currentUserId);
  const setCurrentUser = useLensStore((s) => s.setCurrentUser);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-white/[0.07] bg-[#0a0a0b]/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-zinc-100">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* User switcher (dev convenience) */}
        <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/[0.07] rounded-lg px-2.5 py-1.5">
          <span className="text-[11px] text-zinc-500 mr-1">View as</span>
          {USERS.map((u) => (
            <button
              key={u.id}
              onClick={() => setCurrentUser(u.id as UserId)}
              title={`${u.name} (${u.role})`}
              className="opacity-60 hover:opacity-100 transition-opacity"
              style={{ filter: currentUserId === u.id ? "none" : "grayscale(0.8)" }}
            >
              <UserAvatar userId={u.id as UserId} size="sm" />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
