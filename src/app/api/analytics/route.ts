import { NextResponse } from "next/server";
import { MOCK_SOCIAL_METRICS, MOCK_DASHBOARD_STATS } from "@/lib/mock-data";

export async function GET() {
  /**
   * Production options for social analytics:
   *
   * 1. Phyllo API — best for Instagram + LinkedIn unified ingestion
   *    https://docs.getphyllo.com — OAuth connect once, poll metrics
   *
   * 2. Instagram Graph API — requires Business account + Meta app approval
   *    Endpoint: GET /me/media?fields=like_count,comments_count,reach
   *
   * 3. LinkedIn Marketing API — requires partner approval
   *    Endpoint: GET /organizationalEntityShareStatistics
   *
   * 4. Zapier webhook pipeline — simpler, lower accuracy
   *    Trigger: New post → store metrics to Supabase
   *
   * 5. Manual ingestion — CSV upload UI → parse and store
   *
   * For Beyond Alliance (small team), recommended: Phyllo API
   * It handles both platforms, auth, and normalized data model.
   */

  return NextResponse.json({
    socialMetrics: MOCK_SOCIAL_METRICS,
    dashboardStats: MOCK_DASHBOARD_STATS,
    note: "Mock data. Connect Phyllo API for live Instagram + LinkedIn metrics.",
  });
}
