import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, isProductionRuntime } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime(),
    path: "/",
    maxAge: 0,
  });
  return response;
}
