import { NextResponse } from "next/server";
import { getApiHealth } from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const health = await getApiHealth();

  return NextResponse.json(health, {
    headers: NO_STORE_HEADERS,
    status: health.ok ? 200 : 503,
  });
}
