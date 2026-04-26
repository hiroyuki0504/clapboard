import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, shouldUseSecureAccessCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureAccessCookie(request),
    path: "/",
    maxAge: 0,
  });
  return response;
}
