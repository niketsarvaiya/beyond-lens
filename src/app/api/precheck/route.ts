import { NextRequest, NextResponse } from "next/server";
import { preUploadCheck } from "@/lib/ai/review-engine";
import { getCurrentTasteProfile } from "@/lib/ai/taste-profile";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoName, campaign, platform, frameUrls } = body;

    const tasteProfile = getCurrentTasteProfile();

    const result = await preUploadCheck({
      videoName: videoName ?? "Untitled",
      campaign: campaign ?? "General",
      platform: platform ?? "Instagram",
      frameUrls: frameUrls ?? [],
      tasteProfile,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[/api/precheck]", err);
    return NextResponse.json({ error: "Pre-check failed" }, { status: 500 });
  }
}
