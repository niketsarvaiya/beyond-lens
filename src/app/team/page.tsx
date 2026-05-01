"use client";

import { Header } from "@/components/layout/header";
import { useLensStore } from "@/store/lens-store";
import { UserAvatar } from "@/components/ui/avatar";
import { USERS } from "@/lib/constants";
import { MOCK_DASHBOARD_STATS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Shield, Hammer } from "lucide-react";

export default function TeamPage() {
  const isAdmin = useLensStore((s) => s.isAdmin());
  const videos  = useLensStore((s) => s.videos);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500 text-sm">Team management is visible to admins only.</p>
      </div>
    );
  }

  const admins    = USERS.filter((u) => u.role === "admin");
  const execution = USERS.filter((u) => u.role === "execution");

  return (
    <div className="flex flex-col min-h-full">
      <Header title="Team" subtitle="Access levels and performance" />

      <div className="p-6 space-y-8 animate-fade-in">
        {/* Admin reviewers */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="text-violet-400" />
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Admin Reviewers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {admins.map((user) => (
              <div key={user.id} className="bg-[#18181b] border border-white/[0.07] rounded-xl p-5">
                <div className="flex items-center gap-3 mb-4">
                  <UserAvatar userId={user.id} size="lg" />
                  <div>
                    <p className="font-medium text-zinc-100">{user.name}</p>
                    <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">AI Reviews</span>
                    <span className="text-violet-400">Full access</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Feedback</span>
                    <span className="text-violet-400">Create + edit</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Analytics</span>
                    <span className="text-violet-400">Full access</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Taste Profile</span>
                    <span className="text-violet-400">Train + view</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Execution team */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Hammer size={14} className="text-amber-400" />
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Execution Team</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {execution.map((user) => {
              const perf = MOCK_DASHBOARD_STATS.teamPerformance.find((p) => p.userId === user.id);
              const submitted = videos.filter((v) => v.uploadedBy === user.id).length;
              return (
                <div key={user.id} className="bg-[#18181b] border border-white/[0.07] rounded-xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <UserAvatar userId={user.id} size="lg" />
                    <div>
                      <p className="font-medium text-zinc-100">{user.name}</p>
                      <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Upload videos</span>
                      <span className="text-amber-400">Yes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">View AI review</span>
                      <span className="text-zinc-600">No</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">View feedback</span>
                      <span className="text-amber-400">Own videos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Reply + revise</span>
                      <span className="text-amber-400">Yes</span>
                    </div>
                  </div>
                  {perf && (
                    <div className="pt-3 border-t border-white/[0.05] space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-600">Submissions</span>
                        <span className="text-zinc-300">{submitted}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-zinc-600">Avg revisions</span>
                        <span className={cn("font-medium", perf.avgRevisions > 2 ? "text-amber-400" : "text-emerald-400")}>
                          {perf.avgRevisions.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
