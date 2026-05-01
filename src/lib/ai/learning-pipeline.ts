/**
 * Self-Learning Pipeline
 *
 * Called after a human reviewer finalises feedback on a video.
 * Compares AI scores vs human verdicts to produce a LearningEntry,
 * then updates the TasteProfile weights for future reviews.
 *
 * Pipeline:
 *   1. Diff AI scores vs human scores (explicit or inferred from feedback)
 *   2. Identify missed/overemphasised issues
 *   3. Generate natural-language insight
 *   4. Store LearningEntry
 *   5. Recompute TasteProfile weights
 *   6. Bump profile version
 */

import type { AIReview, FeedbackItem, LearningEntry, TasteProfile, UserId } from "@/types";
import { generateInsight, recomputeWeights } from "./taste-profile";

interface HumanVerdict {
  /** Dimensions explicitly downgraded by the human reviewer */
  downgradedDimensions: string[];
  /** Dimensions the human praised or didn't touch (no feedback) */
  ignoredAIFlags: string[];
  /** New issues the human added that AI didn't catch */
  newIssues: string[];
  /** Explicit per-dimension human scores (if reviewer scored manually) */
  humanScores?: Record<string, number>;
}

/**
 * Infer human verdict from the feedback items they created/edited.
 * This is the implicit learning path — no manual scoring needed.
 */
export function inferHumanVerdict(
  aiReview: AIReview,
  feedbackItems: FeedbackItem[],
  reviewerId: UserId
): HumanVerdict {
  const humanFeedbackDimensions = feedbackItems
    .filter((f) => f.createdBy === reviewerId && f.dimension)
    .map((f) => f.dimension as string);

  const humanNewIssues = feedbackItems
    .filter((f) => !f.isFromAI && f.createdBy === reviewerId)
    .map((f) => f.description);

  const allAIIssues = [...aiReview.mustFix, ...aiReview.niceToImprove];
  const aiIssueDimensions = new Set(
    Object.entries(aiReview.dimensions)
      .filter(([, d]) => d.issues.length > 0)
      .map(([dim]) => dim)
  );

  // Dimensions where AI raised issues but human didn't add any feedback
  const ignoredAIFlags = [...aiIssueDimensions].filter(
    (dim) => !humanFeedbackDimensions.includes(dim)
  );

  return {
    downgradedDimensions: humanFeedbackDimensions,
    ignoredAIFlags,
    newIssues: humanNewIssues,
  };
}

/**
 * Compute per-dimension delta between AI scores and inferred human scores.
 * When human adds feedback on a dimension, we treat that as a -2 penalty
 * signal (they rated it lower than AI). When human ignores an AI flag, +1.5.
 */
function computeDeltas(
  aiScores: Record<string, number>,
  verdict: HumanVerdict
): { humanScores: Record<string, number>; delta: Record<string, number> } {
  const humanScores: Record<string, number> = { ...aiScores };
  const delta: Record<string, number> = {};

  for (const dim of verdict.downgradedDimensions) {
    humanScores[dim] = Math.max(0, (humanScores[dim] ?? 5) - 2);
  }

  for (const dim of verdict.ignoredAIFlags) {
    humanScores[dim] = Math.min(10, (humanScores[dim] ?? 5) + 1.5);
  }

  for (const [dim, aiScore] of Object.entries(aiScores)) {
    delta[dim] = (humanScores[dim] ?? aiScore) - aiScore;
  }

  return { humanScores, delta };
}

/**
 * Main entry point for the learning pipeline.
 * Call this when a reviewer sends final feedback.
 */
export function processFeedbackForLearning(params: {
  aiReview: AIReview;
  feedbackItems: FeedbackItem[];
  reviewerId: UserId;
  currentProfile: TasteProfile;
}): { entry: LearningEntry; updatedProfile: TasteProfile } {
  const { aiReview, feedbackItems, reviewerId, currentProfile } = params;

  const verdict = inferHumanVerdict(aiReview, feedbackItems, reviewerId);

  const aiScores: Record<string, number> = {};
  for (const [dim, data] of Object.entries(aiReview.dimensions)) {
    aiScores[dim] = data.score;
  }

  const { humanScores, delta } = computeDeltas(aiScores, verdict);

  const entryBase = {
    videoId:          aiReview.videoId,
    aiReviewId:       aiReview.id,
    reviewerId,
    aiScores,
    humanScores,
    delta,
    missedIssues:     verdict.newIssues,
    overemphasized:   verdict.ignoredAIFlags,
    humanPriorities:  verdict.downgradedDimensions,
  };

  const insight = generateInsight(entryBase);

  const entry: LearningEntry = {
    id: `le_${Date.now()}`,
    ...entryBase,
    insight,
    createdAt: new Date().toISOString(),
  };

  // Recompute weights based on this new entry
  const newWeights = recomputeWeights(currentProfile.dimensionWeights, [entry]);

  // Update rules: bump confidence for dimensions that keep having the same direction
  const updatedRules = currentProfile.rules.map((rule) => {
    const d = delta[rule.dimension];
    if (d === undefined) return rule;
    const sameDirection = (d > 0 && rule.weight > 1) || (d < 0 && rule.weight < 1);
    return {
      ...rule,
      confidence: Math.min(100, rule.confidence + (sameDirection ? 2 : -1)),
      examplesCount: rule.examplesCount + 1,
      lastUpdated: new Date().toISOString(),
    };
  });

  const updatedProfile: TasteProfile = {
    ...currentProfile,
    version: currentProfile.version + 1,
    dimensionWeights: newWeights,
    rules: updatedRules,
    totalFeedbackSamples: currentProfile.totalFeedbackSamples + 1,
    updatedAt: new Date().toISOString(),
  };

  return { entry, updatedProfile };
}

/**
 * Intelligence layer: detect recurring team mistakes across recent entries.
 * Returns actionable patterns.
 */
export function detectRecurringPatterns(entries: LearningEntry[]): {
  dimension: string;
  occurrences: number;
  insight: string;
}[] {
  const counts: Record<string, number> = {};

  for (const entry of entries) {
    for (const dim of entry.humanPriorities) {
      counts[dim] = (counts[dim] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .filter(([, count]) => count >= 3)
    .sort(([, a], [, b]) => b - a)
    .map(([dimension, occurrences]) => ({
      dimension,
      occurrences,
      insight: `"${dimension.replace(/_/g, " ")}" has been flagged in ${occurrences} of the last ${entries.length} reviews. Consider adding a pre-upload checklist item.`,
    }));
}
