import { NextResponse } from "next/server";
import {
  getCodeReviewSystem,
  publicApiError,
  publicFallbackReason,
} from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const result = await getCodeReviewSystem();
  const error = publicApiError(result.error);

  if (error) {
    return NextResponse.json(error, {
      headers: NO_STORE_HEADERS,
      status: error.status,
    });
  }

  return NextResponse.json({
    reviewSystem: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason: publicFallbackReason(result.fallbackReason),
  }, { headers: NO_STORE_HEADERS });
}
