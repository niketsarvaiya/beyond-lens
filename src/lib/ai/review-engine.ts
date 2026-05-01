/**
 * AI Review Engine
 *
 * Orchestrates video analysis using OpenAI Vision.
 * Steps:
 *   1. Extract frame URLs (from Drive) every ~2 seconds
 *   2. Call GPT-4o Vision with structured prompt + taste profile context
 *   3. Parse structured JSON response into AIReview
 *   4. Apply taste profile weights to compute final scores
 *   5. Calculate confidence and taste alignment
 *
 * In development / mock mode (no API key), returns deterministic mock data.
 */

import OpenAI from "openai";
import type { AIReview, TasteProfile } from "@/types";
import { MOCK_AI_REVIEWS } from "@/lib/mock-data";
import {
  applyTasteWeights,
  calculateConfidence,
  calculateTasteAlignment,
} from "./taste-profile";

const isDev = !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "sk-mock";

/** Build the system prompt injected with the active taste profile rules. */
function buildSystemPrompt(profile: TasteProfile): string {
  const rules = profile.rules
    .sort((a, b) => b.weight - a.weight)
    .map((r) => `- [${r.dimension}] ${r.rule} (weight: ${r.weight.toFixed(1)}, confidence: ${r.confidence}%)`)
    .join("\n");

  return `You are an expert luxury brand video reviewer for Beyond Alliance, a premium smart home automation company.

Your task is to evaluate video content against Beyond Alliance's brand standards.

## Active Taste Profile Rules (Niket's learned preferences):
${rules}

## Evaluation Criteria:
Score each dimension from 0–10, where:
- 0–4: Poor. Fails brand standards.
- 5–6: Needs significant work.
- 7–8: Good. Minor improvements needed.
- 9–10: Excellent. Meets luxury standards.

## Brand Aesthetic Reference:
- Architectural photography style
- Slow, deliberate pacing — no fast cuts
- Subtitles must be large, high-contrast, always readable
- Colors: warm neutrals, deep shadows, premium finishes
- Tone: aspirational, not instructional
- Every frame should look like it belongs in an AD magazine

## Output Format (strict JSON):
Return a JSON object matching the AIReviewOutput type. No markdown, no prose outside the JSON.`;
}

/** User prompt with the actual video context. */
function buildUserPrompt(videoName: string, campaign: string, platform: string): string {
  return `Review this ${platform} video: "${videoName}" (Campaign: ${campaign})

Analyze the provided frames and return a JSON object with this exact structure:
{
  "summary": "2–3 sentence overall assessment",
  "dimensions": {
    "luxury_feel": { "score": 0-10, "reasoning": "...", "issues": [] },
    "visual_composition": { "score": 0-10, "reasoning": "...", "issues": [] },
    "subtitle_readability": { "score": 0-10, "reasoning": "...", "issues": [] },
    "color_contrast": { "score": 0-10, "reasoning": "...", "issues": [] },
    "edit_flow": { "score": 0-10, "reasoning": "...", "issues": [] },
    "hook_strength": { "score": 0-10, "reasoning": "...", "issues": [] },
    "content_clarity": { "score": 0-10, "reasoning": "...", "issues": [] },
    "brand_fit": { "score": 0-10, "reasoning": "...", "issues": [] }
  }
}

Each issue in the issues array must have: { "timestamp": "0:XX", "description": "...", "priority": "must_fix|nice_to_improve", "suggestion": "..." }`;
}

interface RawAIOutput {
  summary: string;
  dimensions: Record<string, {
    score: number;
    reasoning: string;
    issues: Array<{
      timestamp: string;
      description: string;
      priority: "must_fix" | "nice_to_improve";
      suggestion?: string;
    }>;
  }>;
}

/**
 * Core review function. Pass in frame image URLs and video metadata.
 * Returns a fully structured AIReview.
 */
export async function runAIReview(params: {
  videoId: string;
  videoName: string;
  campaign: string;
  platform: string;
  version: number;
  frameUrls: string[];   // public URLs of extracted frames
  tasteProfile: TasteProfile;
}): Promise<AIReview> {
  const { videoId, videoName, campaign, platform, version, frameUrls, tasteProfile } = params;

  // ── Mock mode ────────────────────────────────────────────────────────────
  if (isDev) {
    const mock = MOCK_AI_REVIEWS[videoId];
    if (mock) return mock;

    return buildMockReview(videoId, version, tasteProfile);
  }

  // ── Production: OpenAI Vision ─────────────────────────────────────────────
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const imageMessages = frameUrls.slice(0, 20).map((url) => ({
    type: "image_url" as const,
    image_url: { url, detail: "low" as const },
  }));

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildSystemPrompt(tasteProfile) },
      {
        role: "user",
        content: [
          { type: "text", text: buildUserPrompt(videoName, campaign, platform) },
          ...imageMessages,
        ],
      },
    ],
  });

  const raw: RawAIOutput = JSON.parse(response.choices[0].message.content ?? "{}");
  return structureReview(raw, videoId, version, tasteProfile);
}

/** Convert raw GPT output into a fully structured AIReview. */
function structureReview(
  raw: RawAIOutput,
  videoId: string,
  version: number,
  profile: TasteProfile
): AIReview {
  const rawScores: Record<string, number> = {};
  for (const [dim, data] of Object.entries(raw.dimensions)) {
    rawScores[dim] = data.score;
  }

  const { overallScore } = applyTasteWeights(rawScores, profile);
  const confidenceScore  = calculateConfidence(profile);
  const tasteAlignment   = calculateTasteAlignment(rawScores, profile);

  const allIssues = Object.values(raw.dimensions).flatMap((d) => d.issues ?? []);
  const mustFix       = allIssues.filter((i) => i.priority === "must_fix");
  const niceToImprove = allIssues.filter((i) => i.priority === "nice_to_improve");

  return {
    id: `rev_${videoId}_v${version}_${Date.now()}`,
    videoId,
    videoVersion: version,
    generatedAt: new Date().toISOString(),
    overallScore,
    confidenceScore,
    tasteAlignment,
    modelVersion: `taste-profile-v${profile.version}`,
    summary: raw.summary,
    dimensions: raw.dimensions as AIReview["dimensions"],
    mustFix,
    niceToImprove,
  };
}

/** Deterministic mock for dev/demo mode. */
function buildMockReview(videoId: string, version: number, profile: TasteProfile): AIReview {
  const rawScores = {
    luxury_feel: 6.5, visual_composition: 6.8, subtitle_readability: 5.0,
    color_contrast: 7.0, edit_flow: 6.0, hook_strength: 6.5, content_clarity: 7.0, brand_fit: 6.5,
  };
  const { overallScore } = applyTasteWeights(rawScores, profile);

  return {
    id: `rev_${videoId}_v${version}_mock`,
    videoId,
    videoVersion: version,
    generatedAt: new Date().toISOString(),
    overallScore,
    confidenceScore: calculateConfidence(profile),
    tasteAlignment: calculateTasteAlignment(rawScores, profile),
    modelVersion: `taste-profile-v${profile.version}`,
    summary: "Auto-generated mock review. Upload a real video and add OPENAI_API_KEY for live analysis.",
    dimensions: {
      luxury_feel:          { score: 6.5, reasoning: "Mock review.", issues: [] },
      visual_composition:   { score: 6.8, reasoning: "Mock review.", issues: [] },
      subtitle_readability: { score: 5.0, reasoning: "Mock review.", issues: [{ timestamp: "0:10", description: "Mock: subtitle readability issue", priority: "must_fix", suggestion: "Improve contrast." }] },
      color_contrast:       { score: 7.0, reasoning: "Mock review.", issues: [] },
      edit_flow:            { score: 6.0, reasoning: "Mock review.", issues: [] },
      hook_strength:        { score: 6.5, reasoning: "Mock review.", issues: [] },
      content_clarity:      { score: 7.0, reasoning: "Mock review.", issues: [] },
      brand_fit:            { score: 6.5, reasoning: "Mock review.", issues: [] },
    },
    mustFix: [{ timestamp: "0:10", description: "Mock: subtitle readability issue", priority: "must_fix", suggestion: "Improve contrast." }],
    niceToImprove: [],
  };
}

/**
 * Pre-upload quality check.
 * Runs a lighter, faster check before final submission.
 * Returns predicted rejection reasons.
 */
export async function preUploadCheck(params: {
  videoName: string;
  campaign: string;
  platform: string;
  frameUrls: string[];
  tasteProfile: TasteProfile;
}): Promise<{ score: number; likelyRejections: string[]; suggestions: string[] }> {
  if (isDev) {
    return {
      score: 65,
      likelyRejections: ["Subtitle readability likely insufficient", "Hook may not be strong enough"],
      suggestions: ["Ensure subtitles have dark background strip", "Open with architectural hero shot"],
    };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const topRules = params.tasteProfile.rules
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5)
    .map((r) => `- ${r.rule}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 800,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a pre-submission gatekeeper for luxury video content. Be concise and direct.\nKey rules:\n${topRules}\nReturn JSON: { "score": 0-100, "likelyRejections": ["..."], "suggestions": ["..."] }`,
      },
      {
        role: "user",
        content: [
          { type: "text", text: `Quick check for "${params.videoName}" (${params.platform}, ${params.campaign}). Will this pass review?` },
          ...params.frameUrls.slice(0, 8).map((url) => ({ type: "image_url" as const, image_url: { url, detail: "low" as const } })),
        ],
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content ?? "{}");
}
