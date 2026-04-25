import { NextResponse } from "next/server";
import {
  CSRF_COOKIE_MAX_AGE_SECONDS,
  CSRF_COOKIE_NAME,
  generateCsrfToken,
  isCsrfTokenShape,
} from "@/lib/csrf-token";
import { isProductionRuntime } from "@/lib/access-control";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const existing = parseCookie(cookieHeader, CSRF_COOKIE_NAME);
  const token = isCsrfTokenShape(existing) ? existing : generateCsrfToken();

  const response = NextResponse.json(
    { token },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false,
    sameSite: "lax",
    secure: isProductionRuntime(),
    path: "/",
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}

function parseCookie(header: string, name: string): string | null {
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.split("=");
    if (rawName?.trim() === name) {
      return decodeURIComponent(rest.join("=").trim());
    }
  }
  return null;
}
