"use client";

import { create } from "zustand";
import type { Video, AIReview, FeedbackItem, TasteProfile, UserId } from "@/types";
import {
  MOCK_VIDEOS,
  MOCK_AI_REVIEWS,
  MOCK_FEEDBACK,
  MOCK_TASTE_PROFILE,
} from "@/lib/mock-data";
import { USERS } from "@/lib/constants";

// ─── Store shape — only primitives and plain objects, no computed functions ───
// Selector functions that return new objects/arrays on every call cause
// React 18's useSyncExternalStore (used internally by Zustand) to throw
// "getServerSnapshot should be cached" during SSR pre-rendering.
interface LensStore {
  currentUserId: UserId;
  setCurrentUser: (id: UserId) => void;

  videos: Video[];
  setVideos: (v: Video[]) => void;
  updateVideoStatus: (id: string, status: Video["status"]) => void;

  reviews: Record<string, AIReview>;
  setReview: (videoId: string, review: AIReview) => void;

  feedback: Record<string, FeedbackItem[]>;
  addFeedbackItem: (item: FeedbackItem) => void;
  updateFeedbackStatus: (videoId: string, feedbackId: string, status: FeedbackItem["status"]) => void;
  addReply: (videoId: string, feedbackId: string, reply: FeedbackItem["replies"][0]) => void;

  tasteProfile: TasteProfile;
  updateTasteProfile: (profile: TasteProfile) => void;

  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useLensStore = create<LensStore>()((set) => ({
  currentUserId: "niket",
  setCurrentUser: (id) => set({ currentUserId: id }),

  videos: MOCK_VIDEOS,
  setVideos: (videos) => set({ videos }),
  updateVideoStatus: (id, status) =>
    set((s) => ({
      videos: s.videos.map((v) =>
        v.id === id ? { ...v, status, updatedAt: new Date().toISOString() } : v
      ),
    })),

  reviews: MOCK_AI_REVIEWS,
  setReview: (videoId, review) =>
    set((s) => ({ reviews: { ...s.reviews, [videoId]: review } })),

  feedback: MOCK_FEEDBACK,
  addFeedbackItem: (item) =>
    set((s) => ({
      feedback: {
        ...s.feedback,
        [item.videoId]: [...(s.feedback[item.videoId] ?? []), item],
      },
    })),
  updateFeedbackStatus: (videoId, feedbackId, status) =>
    set((s) => ({
      feedback: {
        ...s.feedback,
        [videoId]: (s.feedback[videoId] ?? []).map((f) =>
          f.id === feedbackId ? { ...f, status, updatedAt: new Date().toISOString() } : f
        ),
      },
    })),
  addReply: (videoId, feedbackId, reply) =>
    set((s) => ({
      feedback: {
        ...s.feedback,
        [videoId]: (s.feedback[videoId] ?? []).map((f) =>
          f.id === feedbackId ? { ...f, replies: [...f.replies, reply] } : f
        ),
      },
    })),

  tasteProfile: MOCK_TASTE_PROFILE,
  updateTasteProfile: (profile) => set({ tasteProfile: profile }),

  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

// ─── Stable derived hooks ─────────────────────────────────────────────────────
// Compute derived values here, outside of selectors, so they never create
// new object references inside useSyncExternalStore's snapshot function.

export function useCurrentUser() {
  const id = useLensStore((s) => s.currentUserId);
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

export function useIsAdmin() {
  const id = useLensStore((s) => s.currentUserId);
  return USERS.find((u) => u.id === id)?.role === "admin";
}
