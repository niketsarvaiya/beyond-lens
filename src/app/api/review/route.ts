import { NextRequest, NextResponse } from "next/server";
import { runAIReview } from "@/lib/ai/review-engine";
import { getCurrentTasteProfile } from "@/lib/ai/taste-profile";
import { MOCK_AI_REVIEWS } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoId, videoName, campaign, platform, version, frameUrls } = body;

    if (!videoId || !videoName) {
      return NextResponse.json({ error: "videoId and videoName are required" }, { status: 400 });
    }

    const tasteProfile = getCurrentTasteProfile();

    const review = await runAIReview({
      videoId,
      videoName,
      campaign: campaign ?? "General",
      platform: platform ?? "Instagram",
      version: version ?? 1,
      frameUrls: frameUrls ?? [],
      tasteProfile,
    });

    return NextResponse.json({ review });
  } catch (err) {
    console.error("[/api/review]", err);
    return NextResponse.json({ error: "Review generation failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) return NextResponse.json({ error: "videoId required" }, { status: 400 });

  const review = MOCK_AI_REVIEWS[videoId];
  if (!review) return NextResponse.json({ error: "Review not found" }, { status: 404 });

  return NextResponse.json({ review });
}
