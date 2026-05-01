import { NextRequest, NextResponse } from "next/server";
import { processFeedbackForLearning, detectRecurringPatterns } from "@/lib/ai/learning-pipeline";
import { getCurrentTasteProfile } from "@/lib/ai/taste-profile";
import { MOCK_LEARNING_ENTRIES } from "@/lib/mock-data";
import type { AIReview, FeedbackItem, UserId } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { aiReview, feedbackItems, reviewerId } = body as {
      aiReview: AIReview;
      feedbackItems: FeedbackItem[];
      reviewerId: UserId;
    };

    if (!aiReview || !reviewerId) {
      return NextResponse.json({ error: "aiReview and reviewerId required" }, { status: 400 });
    }

    const currentProfile = getCurrentTasteProfile();
    const { entry, updatedProfile } = processFeedbackForLearning({
      aiReview,
      feedbackItems: feedbackItems ?? [],
      reviewerId,
      currentProfile,
    });

    // In production: persist entry to Supabase, persist updatedProfile
    // For now, return the computed result
    return NextResponse.json({ entry, updatedProfile });
  } catch (err) {
    console.error("[/api/learning]", err);
    return NextResponse.json({ error: "Learning pipeline failed" }, { status: 500 });
  }
}

export async function GET() {
  const patterns = detectRecurringPatterns(MOCK_LEARNING_ENTRIES);
  return NextResponse.json({
    entries: MOCK_LEARNING_ENTRIES,
    patterns,
    tasteProfile: getCurrentTasteProfile(),
  });
}
