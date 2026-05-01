/**
 * Taste Profile Engine
 *
 * Maintains a dynamic model of Niket's aesthetic preferences.
 * Every human-reviewed piece of content trains this model.
 *
 * Dimension weights start at 1.0 and drift based on deltas between
 * AI scores and human scores across review history.
 */

import type { TasteProfile, LearningEntry } from "@/types";
import { MOCK_TASTE_PROFILE } from "@/lib/mock-data";

const LEARNING_RATE      = 0.05;   // how much one feedback event shifts a weight
const CONFIDENCE_FLOOR   = 30;
const WEIGHT_MIN         = 0.3;
const WEIGHT_MAX         = 2.5;
const CONFIDENCE_PER_SAMPLE = 4;   // each new sample adds ~4 confidence points

/**
 * Given accumulated learning entries, recompute dimension weights for the profile.
 * Positive delta (human > AI) → human cares more → increase weight
 * Negative delta (human < AI) → AI over-penalised → decrease weight
 */
export function recomputeWeights(
  baseline: Record<string, number>,
  entries: LearningEntry[]
): Record<string, number> {
  const weights = { ...baseline };

  for (const entry of entries) {
    for (const [dim, delta] of Object.entries(entry.delta)) {
      if (!(dim in weights)) weights[dim] = 1.0;
      // A negative delta means the human scored it higher than AI
      // (AI was too harsh) — reduce that dimension's weight slightly.
      // A positive delta means the human scored lower — increase weight.
      const adjustment = -delta * LEARNING_RATE;
      weights[dim] = Math.min(WEIGHT_MAX, Math.max(WEIGHT_MIN, weights[dim] + adjustment));
    }
  }

  return weights;
}

/**
 * Apply the taste profile's dimension weights to raw AI scores.
 * Returns adjusted scores (capped at 10) and a recalculated overall.
 */
export function applyTasteWeights(
  rawScores: Record<string, number>,
  profile: TasteProfile
): { adjustedScores: Record<string, number>; overallScore: number } {
  const adjustedScores: Record<string, number> = {};
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [dim, rawScore] of Object.entries(rawScores)) {
    const weight = profile.dimensionWeights[dim] ?? 1.0;
    // Weight affects how much this dimension pulls the overall score, not the displayed score.
    adjustedScores[dim] = rawScore;
    weightedSum += rawScore * weight;
    totalWeight  += weight;
  }

  const overallScore = totalWeight > 0
    ? Math.min(10, Math.round((weightedSum / totalWeight) * 10) / 10)
    : 0;

  return { adjustedScores, overallScore };
}

/**
 * Calculate confidence score for a review.
 * Confidence = how well the taste profile covers the content being reviewed.
 * Low confidence → flag for mandatory human review.
 */
export function calculateConfidence(profile: TasteProfile): number {
  const sampleContrib  = Math.min(50, profile.totalFeedbackSamples * CONFIDENCE_PER_SAMPLE);
  const ruleConfidence = profile.rules.length > 0
    ? profile.rules.reduce((sum, r) => sum + r.confidence, 0) / profile.rules.length
    : 40;
  const ruleContrib = (ruleConfidence / 100) * 50;
  return Math.round(Math.max(CONFIDENCE_FLOOR, Math.min(100, sampleContrib + ruleContrib)));
}

/**
 * Calculate taste alignment — how closely this specific video's
 * scores match the predicted preferences from the taste profile.
 */
export function calculateTasteAlignment(
  rawScores: Record<string, number>,
  profile: TasteProfile
): number {
  const topWeightedDims = Object.entries(profile.dimensionWeights)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([dim]) => dim);

  let alignmentScore = 0;
  let count = 0;

  for (const dim of topWeightedDims) {
    const score = rawScores[dim];
    if (score === undefined) continue;
    // High-priority dimensions with high scores → good alignment
    alignmentScore += (score / 10) * 100 * (profile.dimensionWeights[dim] / 2);
    count++;
  }

  return count > 0 ? Math.round(Math.min(100, alignmentScore / count)) : 50;
}

/**
 * Given new learning data, generate a natural-language insight string.
 */
export function generateInsight(entry: Omit<LearningEntry, "id" | "insight" | "createdAt">): string {
  const biggestGap = Object.entries(entry.delta)
    .sort(([, a], [, b]) => Math.abs(b) - Math.abs(a))[0];

  if (!biggestGap) return "No significant delta detected in this review.";

  const [dim, delta] = biggestGap;
  const direction = delta > 0 ? "underscored" : "overemphasized";
  const dimLabel = dim.replace(/_/g, " ");
  const absDelta = Math.abs(delta).toFixed(1);

  let insight = `AI ${direction} ${dimLabel} by ${absDelta} points compared to ${entry.reviewerId}'s review.`;

  if (entry.missedIssues.length > 0) {
    insight += ` AI missed: "${entry.missedIssues[0]}".`;
  }
  if (entry.overemphasized.length > 0) {
    insight += ` AI over-flagged: "${entry.overemphasized[0]}".`;
  }

  insight += ` Updating ${dimLabel} weight accordingly.`;
  return insight;
}

/** Load the current taste profile. In production, fetch from Supabase. */
export function getCurrentTasteProfile(): TasteProfile {
  return MOCK_TASTE_PROFILE;
}
