/**
 * POST /api/upload/complete
 *
 * Called after the browser finishes streaming to Google Drive.
 * Sets public read permissions, fetches the final metadata, and
 * returns the clean Drive URL + thumbnail URL.
 *
 * Body: { fileId }
 * Returns: { driveUrl, thumbnailUrl, webViewLink }
 */

import { NextRequest, NextResponse } from "next/server";
import { finaliseUpload } from "@/lib/google-drive";

export async function POST(req: NextRequest) {
  try {
    const { fileId } = await req.json();
    if (!fileId) return NextResponse.json({ error: "fileId required" }, { status: 400 });

    const result = await finaliseUpload(fileId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[/api/upload/complete]", err?.message ?? err);
    return NextResponse.json({ error: err?.message ?? "Upload finalisation failed" }, { status: 500 });
  }
}
