"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLensStore, useIsAdmin, useCurrentUser } from "@/store/lens-store";
import { UserAvatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Video, Star, MessageSquare, BarChart3,
  Brain, Users, ChevronLeft, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/",            label: "Dashboard",     icon: LayoutDashboard, adminOnly: false },
  { href: "/videos",      label: "Videos",        icon: Video,           adminOnly: false },
  { href: "/review",      label: "AI Reviews",    icon: Star,            adminOnly: true  },
  { href: "/feedback",    label: "Feedback",      icon: MessageSquare,   adminOnly: false },
  { href: "/analytics",   label: "Analytics",     icon: BarChart3,       adminOnly: true  },
  { href: "/learning",    label: "Taste Profile", icon: Brain,           adminOnly: true  },
  { href: "/team",        label: "Team",          icon: Users,           adminOnly: true  },
];

export function Sidebar() {
  const pathname    = usePathname();
  const isAdmin     = useIsAdmin();
  const currentUser = useCurrentUser();
  const open        = useLensStore((s) => s.sidebarOpen);
  const setOpen     = useLensStore((s) => s.setSidebarOpen);

  const visibleItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside
      className={cn(
        "flex flex-col h-screen sticky top-0 bg-[#111113] border-r border-white/[0.07] transition-all duration-200 shrink-0",
        open ? "w-52" : "w-14"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-14 px-4 border-b border-white/[0.07] shrink-0", !open && "justify-center px-0")}>
        {open ? (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <span className="text-white text-[11px] font-bold">BL</span>
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">Beyond Lens</span>
          </div>
        ) : (
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">BL</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {visibleItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={!open ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-violet-600/15 text-violet-300"
                      : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]",
                    !open && "justify-center px-0 w-10 mx-auto"
                  )}
                >
                  <item.icon size={16} className="shrink-0" />
                  {open && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer: current user + collapse */}
      <div className={cn("p-3 border-t border-white/[0.07] space-y-2")}>
        {open && (
          <div className="flex items-center gap-2.5 px-1">
            <UserAvatar userId={currentUser.id} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-zinc-500 capitalize">{currentUser.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center justify-center w-full h-7 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors"
          title={open ? "Collapse sidebar" : "Expand sidebar"}
        >
          {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>
    </aside>
  );
}
