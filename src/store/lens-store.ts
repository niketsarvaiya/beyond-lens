"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Video, AIReview, FeedbackItem, TasteProfile, User, UserId } from "@/types";
import {
  MOCK_VIDEOS,
  MOCK_AI_REVIEWS,
  MOCK_FEEDBACK,
  MOCK_TASTE_PROFILE,
} from "@/lib/mock-data";
import { USERS } from "@/lib/constants";

interface LensStore {
  // ── Auth ──────────────────────────────────────────────────────────────────
  currentUserId: UserId;
  setCurrentUser: (id: UserId) => void;
  currentUser: () => User;
  isAdmin: () => boolean;

  // ── Videos ────────────────────────────────────────────────────────────────
  videos: Video[];
  setVideos: (v: Video[]) => void;
  getVideo: (id: string) => Video | undefined;
  updateVideoStatus: (id: string, status: Video["status"]) => void;

  // ── AI Reviews ────────────────────────────────────────────────────────────
  reviews: Record<string, AIReview>;     // keyed by videoId
  setReview: (videoId: string, review: AIReview) => void;
  getReview: (videoId: string) => AIReview | undefined;

  // ── Feedback ──────────────────────────────────────────────────────────────
  feedback: Record<string, FeedbackItem[]>;   // keyed by videoId
  addFeedbackItem: (item: FeedbackItem) => void;
  updateFeedbackStatus: (videoId: string, feedbackId: string, status: FeedbackItem["status"]) => void;
  addReply: (videoId: string, feedbackId: string, reply: FeedbackItem["replies"][0]) => void;

  // ── Taste Profile ─────────────────────────────────────────────────────────
  tasteProfile: TasteProfile;
  updateTasteProfile: (profile: TasteProfile) => void;

  // ── UI State ──────────────────────────────────────────────────────────────
  selectedVideoId: string | null;
  setSelectedVideoId: (id: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const useLensStore = create<LensStore>()(
  persist(
    (set, get) => ({
      // ── Auth ──────────────────────────────────────────────────────────────
      currentUserId: "niket",
      setCurrentUser: (id) => set({ currentUserId: id }),
      currentUser: () => USERS.find((u) => u.id === get().currentUserId) ?? USERS[0],
      isAdmin: () => {
        const user = USERS.find((u) => u.id === get().currentUserId);
        return user?.role === "admin";
      },

      // ── Videos ────────────────────────────────────────────────────────────
      videos: MOCK_VIDEOS,
      setVideos: (videos) => set({ videos }),
      getVideo: (id) => get().videos.find((v) => v.id === id),
      updateVideoStatus: (id, status) =>
        set((state) => ({
          videos: state.videos.map((v) =>
            v.id === id ? { ...v, status, updatedAt: new Date().toISOString() } : v
          ),
        })),

      // ── AI Reviews ────────────────────────────────────────────────────────
      reviews: MOCK_AI_REVIEWS,
      setReview: (videoId, review) =>
        set((state) => ({ reviews: { ...state.reviews, [videoId]: review } })),
      getReview: (videoId) => get().reviews[videoId],

      // ── Feedback ──────────────────────────────────────────────────────────
      feedback: MOCK_FEEDBACK,
      addFeedbackItem: (item) =>
        set((state) => ({
          feedback: {
            ...state.feedback,
            [item.videoId]: [...(state.feedback[item.videoId] ?? []), item],
          },
        })),
      updateFeedbackStatus: (videoId, feedbackId, status) =>
        set((state) => ({
          feedback: {
            ...state.feedback,
            [videoId]: (state.feedback[videoId] ?? []).map((f) =>
              f.id === feedbackId ? { ...f, status, updatedAt: new Date().toISOString() } : f
            ),
          },
        })),
      addReply: (videoId, feedbackId, reply) =>
        set((state) => ({
          feedback: {
            ...state.feedback,
            [videoId]: (state.feedback[videoId] ?? []).map((f) =>
              f.id === feedbackId ? { ...f, replies: [...f.replies, reply] } : f
            ),
          },
        })),

      // ── Taste Profile ─────────────────────────────────────────────────────
      tasteProfile: MOCK_TASTE_PROFILE,
      updateTasteProfile: (profile) => set({ tasteProfile: profile }),

      // ── UI State ──────────────────────────────────────────────────────────
      selectedVideoId: null,
      setSelectedVideoId: (id) => set({ selectedVideoId: id }),
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: "beyond-lens-store",
      skipHydration: true,
      partialize: (state) => ({
        currentUserId: state.currentUserId,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
