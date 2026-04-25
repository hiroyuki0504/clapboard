import { NextResponse } from "next/server";
import {
  getProject,
  publicApiError,
  publicFallbackReason,
} from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getProject(id);
  const fallbackReason = publicFallbackReason(result.fallbackReason);
  const error = publicApiError(result.error);

  if (error) {
    return NextResponse.json(error, { status: error.status });
  }

  if (!result.data) {
    return NextResponse.json(
      {
        project: null,
        source: result.source,
        connected: result.connected,
        fallbackReason,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    project: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason,
  });
}
