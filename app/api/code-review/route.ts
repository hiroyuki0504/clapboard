import { NextResponse } from "next/server";
import {
  getCodeReviewSystem,
  publicApiError,
  publicFallbackReason,
} from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getCodeReviewSystem();
  const error = publicApiError(result.error);

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json({
    reviewSystem: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason: publicFallbackReason(result.fallbackReason),
  });
}
