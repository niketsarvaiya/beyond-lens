export const USERS = [
  { id: "niket",   name: "Niket",   role: "admin",     avatar: "N", color: "#7C3AED" },
  { id: "payal",   name: "Payal",   role: "admin",     avatar: "P", color: "#0EA5E9" },
  { id: "ishita",  name: "Ishita",  role: "admin",     avatar: "I", color: "#10B981" },
  { id: "maulik",  name: "Maulik",  role: "admin",     avatar: "M", color: "#F59E0B" },
  { id: "muskan",  name: "Muskan",  role: "execution", avatar: "M", color: "#EC4899" },
  { id: "aryan",   name: "Aryan",   role: "execution", avatar: "A", color: "#6366F1" },
] as const;

export const ADMIN_IDS = ["niket", "payal", "ishita", "maulik"] as const;
export const EXEC_IDS  = ["muskan", "aryan"] as const;

export const VIDEO_STATUSES = [
  "uploaded",
  "ai_reviewed",
  "under_review",
  "feedback_sent",
  "in_revision",
  "approved",
  "scheduled",
  "live",
] as const;

export const STATUS_LABELS: Record<string, string> = {
  uploaded:       "Uploaded",
  ai_reviewed:    "AI Reviewed",
  under_review:   "Under Review",
  feedback_sent:  "Feedback Sent",
  in_revision:    "In Revision",
  approved:       "Approved",
  scheduled:      "Scheduled",
  live:           "Live",
};

export const STATUS_COLORS: Record<string, string> = {
  uploaded:       "bg-zinc-700 text-zinc-300",
  ai_reviewed:    "bg-violet-900/60 text-violet-300",
  under_review:   "bg-blue-900/60 text-blue-300",
  feedback_sent:  "bg-amber-900/60 text-amber-300",
  in_revision:    "bg-orange-900/60 text-orange-300",
  approved:       "bg-emerald-900/60 text-emerald-300",
  scheduled:      "bg-sky-900/60 text-sky-300",
  live:           "bg-green-900/60 text-green-300",
};

export const PLATFORMS = ["Instagram", "LinkedIn"] as const;

export const CAMPAIGNS = [
  "Beyond Series",
  "Smart Living",
  "Product Launch",
  "Brand Story",
  "Client Spotlight",
] as const;

export const REVIEW_DIMENSIONS = [
  { key: "luxury_feel",        label: "Luxury Brand Feel",         icon: "✦" },
  { key: "visual_composition", label: "Visual Composition",        icon: "⊡" },
  { key: "subtitle_readability",label: "Subtitle Readability",     icon: "T" },
  { key: "color_contrast",     label: "Color & Contrast",          icon: "◑" },
  { key: "edit_flow",          label: "Edit Flow & Transitions",   icon: "→" },
  { key: "hook_strength",      label: "Hook Strength (0–3s)",      icon: "⚡" },
  { key: "content_clarity",    label: "Content Clarity",           icon: "◎" },
  { key: "brand_fit",          label: "Brand Fit",                 icon: "◈" },
] as const;

export const FEEDBACK_PRIORITIES = ["must_fix", "nice_to_improve"] as const;
export const FEEDBACK_STATUSES   = ["pending", "in_progress", "done", "clarification_needed"] as const;
