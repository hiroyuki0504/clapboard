import { NextResponse } from "next/server";
import { getProject } from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await getProject(id);

  if (!result.data) {
    return NextResponse.json(
      {
        project: null,
        source: result.source,
        connected: result.connected,
        fallbackReason: result.fallbackReason ?? null,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    project: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason: result.fallbackReason ?? null,
  });
}
