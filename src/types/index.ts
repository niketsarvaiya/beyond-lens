import type { PLATFORMS, CAMPAIGNS, VIDEO_STATUSES, FEEDBACK_PRIORITIES, FEEDBACK_STATUSES } from "@/lib/constants";

// ─── Users ──────────────────────────────────────────────────────────────────
export type UserRole = "admin" | "execution";
export type UserId = "niket" | "payal" | "ishita" | "maulik" | "muskan" | "aryan";

export interface User {
  id: UserId;
  name: string;
  role: UserRole;
  avatar: string;
  color: string;
}

// ─── Videos ─────────────────────────────────────────────────────────────────
export type VideoStatus = (typeof VIDEO_STATUSES)[number];
export type Platform    = (typeof PLATFORMS)[number];
export type Campaign    = (typeof CAMPAIGNS)[number];

export interface VideoVersion {
  id: string;
  version: number;           // 1, 2, 3…
  driveUrl: string;
  thumbnailUrl?: string;
  uploadedBy: UserId;
  uploadedAt: string;
  sizeBytes?: number;
  durationSeconds?: number;
}

export interface Video {
  id: string;
  name: string;
  campaign: Campaign;
  project?: string;
  platform: Platform;
  status: VideoStatus;
  goLiveDate?: string;
  uploadedBy: UserId;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
  versions: VideoVersion[];
  driveFolder?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  tags?: string[];
}

// ─── AI Review ───────────────────────────────────────────────────────────────
export interface DimensionScore {
  score: number;          // 0–10
  reasoning: string;
  issues: TimestampIssue[];
}

export interface TimestampIssue {
  timestamp: string;      // "0:03"
  description: string;
  priority: "must_fix" | "nice_to_improve";
  suggestion?: string;
}

export interface AIReview {
  id: string;
  videoId: string;
  videoVersion: number;
  generatedAt: string;
  overallScore: number;       // 0–10
  confidenceScore: number;    // 0–100
  summary: string;
  dimensions: {
    luxury_feel:         DimensionScore;
    visual_composition:  DimensionScore;
    subtitle_readability:DimensionScore;
    color_contrast:      DimensionScore;
    edit_flow:           DimensionScore;
    hook_strength:       DimensionScore;
    content_clarity:     DimensionScore;
    brand_fit:           DimensionScore;
  };
  mustFix:       TimestampIssue[];
  niceToImprove: TimestampIssue[];
  tasteAlignment: number;      // 0–100, how well it matches Niket's taste
  modelVersion: string;        // which taste-profile version was used
}

// ─── Feedback ────────────────────────────────────────────────────────────────
export type FeedbackPriority = (typeof FEEDBACK_PRIORITIES)[number];
export type FeedbackStatus   = (typeof FEEDBACK_STATUSES)[number];

export interface FeedbackItem {
  id: string;
  videoId: string;
  aiReviewId?: string;
  createdBy: UserId;
  description: string;
  timestamp?: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  createdAt: string;
  updatedAt: string;
  replies: FeedbackReply[];
  dimension?: string;
  isFromAI: boolean;          // true = converted from AI suggestion
}

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  authorId: UserId;
  message: string;
  createdAt: string;
}

// ─── Taste Profile ───────────────────────────────────────────────────────────
export interface TasteProfileRule {
  id: string;
  source: "inferred" | "explicit";
  dimension: string;
  rule: string;               // natural language, e.g. "Subtitle readability is critical"
  weight: number;             // multiplier 0.5–2.0 applied to that dimension's score
  confidence: number;         // how strongly established this rule is (0–100)
  examplesCount: number;      // how many feedback instances support this
  lastUpdated: string;
}

export interface TasteProfile {
  id: string;
  ownerId: UserId;            // "niket"
  version: number;
  rules: TasteProfileRule[];
  dimensionWeights: Record<string, number>;  // per-dimension score multipliers
  updatedAt: string;
  totalFeedbackSamples: number;
}

// ─── Learning Entry ──────────────────────────────────────────────────────────
export interface LearningEntry {
  id: string;
  videoId: string;
  aiReviewId: string;
  reviewerId: UserId;
  createdAt: string;
  aiScores: Record<string, number>;
  humanScores: Record<string, number>;
  delta: Record<string, number>;       // human - ai per dimension
  missedIssues: string[];              // what AI missed
  overemphasized: string[];            // what AI flagged but human ignored
  humanPriorities: string[];           // what human stressed
  insight: string;                     // auto-generated natural language insight
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface SocialMetrics {
  platform: Platform;
  period: string;
  followers: number;
  followersGrowth: number;
  engagement: number;
  engagementRate: number;
  reach: number;
  impressions: number;
  topPosts: PostMetric[];
  updatedAt: string;
}

export interface PostMetric {
  id: string;
  videoId?: string;
  caption: string;
  platform: Platform;
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
  engagementRate: number;
}

// ─── Dashboard Stats ─────────────────────────────────────────────────────────
export interface DashboardStats {
  totalVideos: number;
  pendingReview: number;
  inRevision: number;
  approvedThisMonth: number;
  avgAIScore: number;
  avgConfidence: number;
  commonIssues: { issue: string; count: number }[];
  teamPerformance: { userId: UserId; submitted: number; avgRevisions: number }[];
  tasteAlignmentTrend: { date: string; score: number }[];
}
