import { NextResponse } from "next/server";
import {
  getProjects,
  publicApiError,
  publicFallbackReason,
} from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getProjects();
  const error = publicApiError(result.error);

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  return NextResponse.json({
    projects: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason: publicFallbackReason(result.fallbackReason),
  });
}
