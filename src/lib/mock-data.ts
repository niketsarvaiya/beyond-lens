import type { Video, AIReview, FeedbackItem, TasteProfile, LearningEntry, DashboardStats, SocialMetrics } from "@/types";

// ─── Taste Profile ────────────────────────────────────────────────────────────
export const MOCK_TASTE_PROFILE: TasteProfile = {
  id: "tp_niket_v7",
  ownerId: "niket",
  version: 7,
  totalFeedbackSamples: 38,
  updatedAt: "2026-04-28T10:30:00Z",
  dimensionWeights: {
    luxury_feel:         1.4,
    visual_composition:  1.2,
    subtitle_readability: 1.8,
    color_contrast:      1.0,
    edit_flow:           0.8,
    hook_strength:       1.5,
    content_clarity:     1.3,
    brand_fit:           1.6,
  },
  rules: [
    {
      id: "r1", source: "inferred", dimension: "subtitle_readability",
      rule: "Subtitle readability is non-negotiable. Unreadable subtitles are always must-fix.",
      weight: 1.8, confidence: 94, examplesCount: 14, lastUpdated: "2026-04-25T00:00:00Z",
    },
    {
      id: "r2", source: "inferred", dimension: "edit_flow",
      rule: "Fast flashy transitions are penalized. Luxury = slower pacing, clean cuts.",
      weight: 0.8, confidence: 88, examplesCount: 11, lastUpdated: "2026-04-20T00:00:00Z",
    },
    {
      id: "r3", source: "inferred", dimension: "hook_strength",
      rule: "The first 3 seconds must immediately convey premium quality.",
      weight: 1.5, confidence: 82, examplesCount: 9, lastUpdated: "2026-04-18T00:00:00Z",
    },
    {
      id: "r4", source: "inferred", dimension: "brand_fit",
      rule: "No consumer-grade aesthetic. Every frame should feel like architectural photography.",
      weight: 1.6, confidence: 91, examplesCount: 12, lastUpdated: "2026-04-22T00:00:00Z",
    },
    {
      id: "r5", source: "inferred", dimension: "color_contrast",
      rule: "Minor lighting inconsistencies are deprioritized unless they affect brand colors.",
      weight: 1.0, confidence: 72, examplesCount: 6, lastUpdated: "2026-04-10T00:00:00Z",
    },
  ],
};

// ─── Videos ───────────────────────────────────────────────────────────────────
export const MOCK_VIDEOS: Video[] = [
  {
    id: "vid_001",
    name: "Smart Living Room Reveal",
    campaign: "Beyond Series",
    project: "Prestige Hills",
    platform: "Instagram",
    status: "feedback_sent",
    goLiveDate: "2026-05-07",
    uploadedBy: "maulik",
    createdAt: "2026-04-27T09:00:00Z",
    updatedAt: "2026-04-28T14:00:00Z",
    currentVersion: 2,
    thumbnailUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    durationSeconds: 47,
    tags: ["reveal", "living-room", "automation"],
    versions: [
      {
        id: "v_001_1", version: 1, driveUrl: "#",
        uploadedBy: "maulik", uploadedAt: "2026-04-27T09:00:00Z",
        sizeBytes: 245000000, durationSeconds: 47,
      },
      {
        id: "v_001_2", version: 2, driveUrl: "#",
        uploadedBy: "maulik", uploadedAt: "2026-04-28T11:00:00Z",
        sizeBytes: 238000000, durationSeconds: 46,
      },
    ],
  },
  {
    id: "vid_002",
    name: "KNX Lighting Control Explainer",
    campaign: "Smart Living",
    project: "Lodha Altamount",
    platform: "LinkedIn",
    status: "under_review",
    goLiveDate: "2026-05-10",
    uploadedBy: "aryan",
    createdAt: "2026-04-26T15:00:00Z",
    updatedAt: "2026-04-27T10:00:00Z",
    currentVersion: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=600&q=80",
    durationSeconds: 62,
    tags: ["knx", "lighting", "explainer"],
    versions: [
      {
        id: "v_002_1", version: 1, driveUrl: "#",
        uploadedBy: "aryan", uploadedAt: "2026-04-26T15:00:00Z",
        sizeBytes: 312000000, durationSeconds: 62,
      },
    ],
  },
  {
    id: "vid_003",
    name: "Beyond Alliance Brand Story",
    campaign: "Brand Story",
    platform: "Instagram",
    status: "approved",
    goLiveDate: "2026-05-01",
    uploadedBy: "muskan",
    createdAt: "2026-04-20T10:00:00Z",
    updatedAt: "2026-04-25T16:00:00Z",
    currentVersion: 3,
    thumbnailUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80",
    durationSeconds: 90,
    tags: ["brand", "story", "premium"],
    versions: [
      { id: "v_003_1", version: 1, driveUrl: "#", uploadedBy: "muskan", uploadedAt: "2026-04-20T10:00:00Z" },
      { id: "v_003_2", version: 2, driveUrl: "#", uploadedBy: "muskan", uploadedAt: "2026-04-22T10:00:00Z" },
      { id: "v_003_3", version: 3, driveUrl: "#", uploadedBy: "muskan", uploadedAt: "2026-04-24T10:00:00Z" },
    ],
  },
  {
    id: "vid_004",
    name: "Home Cinema Experience",
    campaign: "Product Launch",
    project: "One Ritz Carlton",
    platform: "Instagram",
    status: "in_revision",
    uploadedBy: "maulik",
    createdAt: "2026-04-25T08:00:00Z",
    updatedAt: "2026-04-28T09:00:00Z",
    currentVersion: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600&q=80",
    durationSeconds: 55,
    tags: ["cinema", "audio", "product"],
    versions: [
      { id: "v_004_1", version: 1, driveUrl: "#", uploadedBy: "maulik", uploadedAt: "2026-04-25T08:00:00Z" },
    ],
  },
  {
    id: "vid_005",
    name: "Client Testimonial — Bandra Penthouse",
    campaign: "Client Spotlight",
    platform: "LinkedIn",
    status: "uploaded",
    uploadedBy: "aryan",
    createdAt: "2026-04-29T11:00:00Z",
    updatedAt: "2026-04-29T11:00:00Z",
    currentVersion: 1,
    thumbnailUrl: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80",
    durationSeconds: 78,
    tags: ["testimonial", "client"],
    versions: [
      { id: "v_005_1", version: 1, driveUrl: "#", uploadedBy: "aryan", uploadedAt: "2026-04-29T11:00:00Z" },
    ],
  },
  {
    id: "vid_006",
    name: "Savant Ecosystem Walkthrough",
    campaign: "Smart Living",
    project: "Prestige Hills",
    platform: "Instagram",
    status: "live",
    goLiveDate: "2026-04-22",
    uploadedBy: "muskan",
    createdAt: "2026-04-15T10:00:00Z",
    updatedAt: "2026-04-22T10:00:00Z",
    currentVersion: 2,
    thumbnailUrl: "https://images.unsplash.com/photo-1558618047-3e8e34e61fee?w=600&q=80",
    durationSeconds: 68,
    tags: ["savant", "ecosystem", "walkthrough"],
    versions: [
      { id: "v_006_1", version: 1, driveUrl: "#", uploadedBy: "muskan", uploadedAt: "2026-04-15T10:00:00Z" },
      { id: "v_006_2", version: 2, driveUrl: "#", uploadedBy: "muskan", uploadedAt: "2026-04-19T10:00:00Z" },
    ],
  },
];

// ─── AI Reviews ───────────────────────────────────────────────────────────────
export const MOCK_AI_REVIEWS: Record<string, AIReview> = {
  vid_001: {
    id: "rev_001",
    videoId: "vid_001",
    videoVersion: 2,
    generatedAt: "2026-04-28T12:00:00Z",
    overallScore: 6.8,
    confidenceScore: 74,
    tasteAlignment: 68,
    modelVersion: "taste-profile-v7",
    summary: "Strong visual composition and luxury atmosphere in the reveal sequence, but subtitle legibility breaks down at 0:12 and 0:31. The hook opens well but the cut at 0:04 feels abrupt — slightly jarring for the premium audience. Brand fit is solid throughout the second half.",
    dimensions: {
      luxury_feel:          { score: 7.8, reasoning: "Warm cinematic tones, architectural framing. Living room sequence from 0:18 onward is particularly strong.", issues: [] },
      visual_composition:   { score: 7.2, reasoning: "Wide shots are well-composed. Mid-shots occasionally cut off the ceiling light fixture.", issues: [{ timestamp: "0:22", description: "Control panel partially clipped", priority: "nice_to_improve", suggestion: "Widen the shot by 10% to include the full panel." }] },
      subtitle_readability: { score: 4.1, reasoning: "Font size too small on mobile. Low contrast against the cream wall at 0:12.", issues: [{ timestamp: "0:12", description: "White subtitle text against cream wall — near invisible", priority: "must_fix", suggestion: "Add a semi-transparent dark background strip or switch to black subtitle text with white outline." }, { timestamp: "0:31", description: "Subtitle overlaps with on-screen display", priority: "must_fix", suggestion: "Move subtitle band lower." }] },
      color_contrast:       { score: 7.0, reasoning: "Consistent warm palette. 0:08 has a slightly overexposed window but doesn't harm brand perception.", issues: [{ timestamp: "0:08", description: "Window overexposure visible", priority: "nice_to_improve", suggestion: "Grade the window region -0.5EV in post." }] },
      edit_flow:            { score: 6.5, reasoning: "Pacing is mostly appropriate but the cut at 0:04 is too sharp for a luxury context.", issues: [{ timestamp: "0:04", description: "Hard cut feels abrupt — use a 12-frame dissolve instead", priority: "must_fix", suggestion: "Replace with a slow-dissolve or L-cut." }] },
      hook_strength:        { score: 7.5, reasoning: "Opening shot of the Crestron panel illuminating is a strong hook. Communicates premium instantly.", issues: [] },
      content_clarity:      { score: 7.0, reasoning: "Key features are clearly demonstrated. The voice-over script is easy to follow.", issues: [] },
      brand_fit:            { score: 7.8, reasoning: "Architectural aesthetic matches Beyond Alliance positioning strongly in the second half.", issues: [] },
    },
    mustFix: [
      { timestamp: "0:12", description: "Subtitle invisible on cream background", priority: "must_fix", suggestion: "Dark strip behind subtitles" },
      { timestamp: "0:31", description: "Subtitle overlaps on-screen display", priority: "must_fix", suggestion: "Move subtitle band lower" },
      { timestamp: "0:04", description: "Abrupt cut disrupts premium flow", priority: "must_fix", suggestion: "Use slow dissolve or L-cut" },
    ],
    niceToImprove: [
      { timestamp: "0:22", description: "Control panel slightly clipped", priority: "nice_to_improve", suggestion: "Widen shot 10%" },
      { timestamp: "0:08", description: "Window overexposure", priority: "nice_to_improve", suggestion: "Grade -0.5EV" },
    ],
  },
  vid_002: {
    id: "rev_002",
    videoId: "vid_002",
    videoVersion: 1,
    generatedAt: "2026-04-27T08:00:00Z",
    overallScore: 5.9,
    confidenceScore: 61,
    tasteAlignment: 55,
    modelVersion: "taste-profile-v7",
    summary: "Technically competent explainer but lacks the luxury feel expected for Beyond Alliance LinkedIn content. Hook is weak — opens on a close-up of a keypad without context. Subtitles are readable. Main concern is pacing: too fast and educational, not aspirational.",
    dimensions: {
      luxury_feel:          { score: 5.0, reasoning: "Feels like a product demo, not a lifestyle. No architectural framing, no aspirational context shot.", issues: [{ timestamp: "0:00", description: "No establishing luxury shot", priority: "must_fix", suggestion: "Add a 5-second establishing shot of the space before cutting to product." }] },
      visual_composition:   { score: 6.2, reasoning: "Functional but uninspired. The panel is well-lit but the background is a bare wall.", issues: [] },
      subtitle_readability: { score: 7.5, reasoning: "Clean font, good contrast throughout.", issues: [] },
      color_contrast:       { score: 6.8, reasoning: "Neutral, no issues.", issues: [] },
      edit_flow:            { score: 5.5, reasoning: "Too many quick cuts for a LinkedIn professional audience. Each beat needs more breathing room.", issues: [{ timestamp: "0:15", description: "4 cuts in 3 seconds — too fast", priority: "must_fix", suggestion: "Slow down sequence to 1 cut per 2 seconds." }] },
      hook_strength:        { score: 4.5, reasoning: "Opens on a static keypad with no movement. Low intrigue.", issues: [{ timestamp: "0:00", description: "Static opening shot", priority: "must_fix", suggestion: "Open with lights dimming/brightening in a beautiful space." }] },
      content_clarity:      { score: 7.5, reasoning: "Very clear what KNX does by the end. Well-structured.", issues: [] },
      brand_fit:            { score: 5.5, reasoning: "Feels generic. Could be any smart home company. Missing Beyond Alliance signature aesthetic.", issues: [] },
    },
    mustFix: [
      { timestamp: "0:00", description: "No luxury establishing shot", priority: "must_fix", suggestion: "5-second architecture hero shot" },
      { timestamp: "0:00", description: "Hook is static and uninspiring", priority: "must_fix", suggestion: "Open with dynamic lighting scene" },
      { timestamp: "0:15", description: "Too many rapid cuts", priority: "must_fix", suggestion: "1 cut per 2 seconds" },
    ],
    niceToImprove: [],
  },
};

// ─── Feedback Items ───────────────────────────────────────────────────────────
export const MOCK_FEEDBACK: Record<string, FeedbackItem[]> = {
  vid_001: [
    {
      id: "fb_001_1", videoId: "vid_001", aiReviewId: "rev_001",
      createdBy: "niket", description: "Subtitles at 0:12 are completely unreadable against the cream wall. This is a must-fix before any approval.", timestamp: "0:12",
      priority: "must_fix", status: "in_progress",
      createdAt: "2026-04-28T14:00:00Z", updatedAt: "2026-04-29T09:00:00Z",
      dimension: "subtitle_readability", isFromAI: true,
      replies: [
        { id: "r1", feedbackId: "fb_001_1", authorId: "maulik", message: "On it — adding a dark semi-transparent strip. Will upload V3 by EOD.", createdAt: "2026-04-29T09:00:00Z" },
      ],
    },
    {
      id: "fb_001_2", videoId: "vid_001", aiReviewId: "rev_001",
      createdBy: "niket", description: "The cut at 0:04 kills the luxury mood. Please use a slow dissolve — minimum 12 frames.", timestamp: "0:04",
      priority: "must_fix", status: "pending",
      createdAt: "2026-04-28T14:05:00Z", updatedAt: "2026-04-28T14:05:00Z",
      dimension: "edit_flow", isFromAI: true,
      replies: [],
    },
    {
      id: "fb_001_3", videoId: "vid_001",
      createdBy: "payal", description: "The second half from 0:30 onward is excellent — the pacing and brand feel are exactly right. Keep this as the reference for future videos.", timestamp: "0:30",
      priority: "nice_to_improve", status: "done",
      createdAt: "2026-04-28T15:00:00Z", updatedAt: "2026-04-28T15:00:00Z",
      dimension: "brand_fit", isFromAI: false,
      replies: [],
    },
  ],
  vid_002: [
    {
      id: "fb_002_1", videoId: "vid_002", aiReviewId: "rev_002",
      createdBy: "ishita", description: "This needs a complete rethink on the opening 10 seconds. Start with the space, then cut to product. Not the other way.", timestamp: "0:00",
      priority: "must_fix", status: "pending",
      createdAt: "2026-04-27T11:00:00Z", updatedAt: "2026-04-27T11:00:00Z",
      dimension: "hook_strength", isFromAI: false,
      replies: [],
    },
  ],
};

// ─── Learning Entries ─────────────────────────────────────────────────────────
export const MOCK_LEARNING_ENTRIES: LearningEntry[] = [
  {
    id: "le_001", videoId: "vid_003", aiReviewId: "rev_003_old",
    reviewerId: "niket", createdAt: "2026-04-25T17:00:00Z",
    aiScores: { subtitle_readability: 7.0, edit_flow: 6.0, hook_strength: 7.0 },
    humanScores: { subtitle_readability: 4.5, edit_flow: 8.0, hook_strength: 7.5 },
    delta: { subtitle_readability: -2.5, edit_flow: 2.0, hook_strength: 0.5 },
    missedIssues: ["Subtitle at 0:08 uses italic font — hard to read in motion"],
    overemphasized: ["Edit flow was flagged but Niket approved it"],
    humanPriorities: ["subtitle_readability"],
    insight: "Niket prioritizes subtitle readability more than AI predicted (-2.5 delta). AI over-penalised edit flow which Niket found acceptable. Increasing subtitle weight.",
  },
  {
    id: "le_002", videoId: "vid_006", aiReviewId: "rev_006_old",
    reviewerId: "niket", createdAt: "2026-04-22T16:00:00Z",
    aiScores: { luxury_feel: 6.5, brand_fit: 6.0, hook_strength: 5.5 },
    humanScores: { luxury_feel: 7.5, brand_fit: 7.0, hook_strength: 8.0 },
    delta: { luxury_feel: 1.0, brand_fit: 1.0, hook_strength: 2.5 },
    missedIssues: ["AI missed the architectural hero shot in the opening"],
    overemphasized: [],
    humanPriorities: ["hook_strength", "brand_fit"],
    insight: "AI consistently underscores hook_strength when the opening contains architectural wide shots. Niket rated +2.5 above AI. Updating hook recognition heuristic.",
  },
];

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalVideos: 6,
  pendingReview: 2,
  inRevision: 1,
  approvedThisMonth: 2,
  avgAIScore: 6.4,
  avgConfidence: 68,
  commonIssues: [
    { issue: "Subtitle readability", count: 8 },
    { issue: "Weak hook (first 3s)", count: 6 },
    { issue: "Fast transitions", count: 5 },
    { issue: "Missing luxury establishing shot", count: 4 },
    { issue: "Brand colors off", count: 2 },
  ],
  teamPerformance: [
    { userId: "maulik",  submitted: 8,  avgRevisions: 2.1 },
    { userId: "muskan",  submitted: 7,  avgRevisions: 1.6 },
    { userId: "aryan",   submitted: 6,  avgRevisions: 2.4 },
  ],
  tasteAlignmentTrend: [
    { date: "2026-03-01", score: 48 },
    { date: "2026-03-15", score: 55 },
    { date: "2026-04-01", score: 61 },
    { date: "2026-04-15", score: 68 },
    { date: "2026-05-01", score: 74 },
  ],
};

// ─── Social Analytics ─────────────────────────────────────────────────────────
export const MOCK_SOCIAL_METRICS: SocialMetrics[] = [
  {
    platform: "Instagram",
    period: "Last 30 days",
    followers: 12480,
    followersGrowth: 6.2,
    engagement: 3840,
    engagementRate: 4.8,
    reach: 84200,
    impressions: 126000,
    updatedAt: "2026-05-01T00:00:00Z",
    topPosts: [
      { id: "p1", videoId: "vid_006", caption: "Savant Ecosystem Walkthrough", platform: "Instagram", postedAt: "2026-04-22T10:00:00Z", likes: 842, comments: 38, shares: 124, reach: 18400, engagementRate: 5.4 },
      { id: "p2", videoId: "vid_003", caption: "Beyond Alliance Brand Story", platform: "Instagram", postedAt: "2026-05-01T10:00:00Z", likes: 1204, comments: 67, shares: 88, reach: 22000, engagementRate: 6.2 },
    ],
  },
  {
    platform: "LinkedIn",
    period: "Last 30 days",
    followers: 4820,
    followersGrowth: 3.1,
    engagement: 1260,
    engagementRate: 3.2,
    reach: 38400,
    impressions: 52000,
    updatedAt: "2026-05-01T00:00:00Z",
    topPosts: [
      { id: "p3", caption: "Smart Home Design Philosophy", platform: "LinkedIn", postedAt: "2026-04-18T09:00:00Z", likes: 312, comments: 42, shares: 68, reach: 9200, engagementRate: 4.1 },
    ],
  },
];
