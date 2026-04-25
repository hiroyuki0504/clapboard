import { NextResponse } from "next/server";
import { getApiHealth } from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await getApiHealth();

  return NextResponse.json(health, { status: health.ok ? 200 : 503 });
}
