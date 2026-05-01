/**
 * POST /api/upload/init
 *
 * Called before the browser uploads a video. Returns a resumable Google
 * Drive upload URL so the file bytes go directly to Drive — the server
 * never touches the video data.
 *
 * Body: { fileName, mimeType, sizeBytes, campaign, videoName, version }
 * Returns: { uploadUrl, fileId, folderId }
 */

import { NextRequest, NextResponse } from "next/server";
import { resolveVersionFolder, createResumableUploadUrl } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  try {
    const { fileName, mimeType, sizeBytes, campaign, videoName, version } = await req.json();

    if (!fileName || !mimeType || !sizeBytes || !campaign || !videoName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
      return NextResponse.json(
        { error: "GOOGLE_DRIVE_ROOT_FOLDER_ID not configured" },
        { status: 503 }
      );
    }

    const folderId = await resolveVersionFolder(campaign, videoName, version ?? 1);
    const { uploadUrl, fileId } = await createResumableUploadUrl({
      fileName,
      mimeType,
      folderId,
      sizeBytes,
    });

    return NextResponse.json({ uploadUrl, fileId, folderId });
  } catch (err: any) {
    console.error("[/api/upload/init]", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Upload init failed" }, { status: 500 });
  }
}
