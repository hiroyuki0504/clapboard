import { NextResponse } from "next/server";
import { getCodeReviewSystem, publicFallbackReason } from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getCodeReviewSystem();

  return NextResponse.json({
    reviewSystem: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason: publicFallbackReason(result.fallbackReason),
  });
}
