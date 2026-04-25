import { NextResponse } from "next/server";
import { getProjects } from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getProjects();

  return NextResponse.json({
    projects: result.data,
    source: result.source,
    connected: result.connected,
    fallbackReason: result.fallbackReason ?? null,
  });
}
