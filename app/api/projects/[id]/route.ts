import { NextResponse } from "next/server";
import {
  getProject,
  publicApiError,
  publicFallbackReason,
} from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getProject(id);
  const fallbackReason = publicFallbackReason(result.fallbackReason);
  const error = publicApiError(result.error);

  if (error) {
    return NextResponse.json(error, {
      headers: NO_STORE_HEADERS,
      status: error.status,
    });
  }

  if (!result.data) {
    return NextResponse.json(
      {
        project: null,
        source: result.source,
        connected: result.connected,
        fallbackReason,
      },
      { headers: NO_STORE_HEADERS, status: 404 },
    );
  }

  return NextResponse.json({
    project: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason,
  }, { headers: NO_STORE_HEADERS });
}
