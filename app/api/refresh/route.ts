import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  ACCESS_JWT_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_JWT_TTL_SECONDS,
  isProductionRuntime,
} from "@/lib/access-control";
import {
  CSRF_COOKIE_MAX_AGE_SECONDS,
  CSRF_COOKIE_NAME,
  generateCsrfToken,
} from "@/lib/csrf-token";
import { isJwtSecretStrong, signJwt, verifyTypedJwt } from "@/lib/jwt";
import { clientKeyFromHeaders, consumeRateLimit } from "@/lib/rate-limit";
import type { Role } from "@/lib/access-token";

export const dynamic = "force-dynamic";

const REFRESH_RATE_LIMIT = 30;
const REFRESH_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RESPONSE_HEADERS = { "cache-control": "no-store" } as const;

function rateLimitHeaders(decision: {
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
}) {
  const headers: Record<string, string> = {
    ...RESPONSE_HEADERS,
    "x-ratelimit-limit": String(decision.limit),
    "x-ratelimit-remaining": String(decision.remaining),
  };
  if (decision.retryAfterSeconds > 0) {
    headers["retry-after"] = String(decision.retryAfterSeconds);
  }
  return headers;
}

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "viewer";
}

export async function POST(request: Request) {
  const clientKey = `refresh:${clientKeyFromHeaders(request.headers)}`;
  const rate = await consumeRateLimit(
    clientKey,
    REFRESH_RATE_LIMIT,
    REFRESH_RATE_LIMIT_WINDOW_MS,
  );

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate-limited" },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  const jwtSecret = process.env.CLAPBOARD_JWT_SECRET;
  if (!isJwtSecretStrong(jwtSecret)) {
    return NextResponse.json(
      { error: "service-unavailable", message: "service configuration error" },
      { status: 503, headers: rateLimitHeaders(rate) },
    );
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const refreshToken = parseCookie(cookieHeader, REFRESH_COOKIE_NAME);
  if (!refreshToken) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: rateLimitHeaders(rate) },
    );
  }

  const claims = await verifyTypedJwt<{ role?: unknown }>(
    refreshToken,
    jwtSecret,
    "refresh",
  );
  if (!claims || !isRole(claims.role)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: rateLimitHeaders(rate) },
    );
  }

  const role = claims.role;
  const newAccess = await signJwt(
    { role, type: "access" },
    jwtSecret,
    ACCESS_JWT_TTL_SECONDS,
  );
  const newRefresh = await signJwt(
    { role, type: "refresh" },
    jwtSecret,
    REFRESH_JWT_TTL_SECONDS,
  );
  const csrfToken = generateCsrfToken();

  const response = NextResponse.json(
    { ok: true, role, csrfToken },
    { status: 200, headers: rateLimitHeaders(rate) },
  );
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: newAccess,
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime(),
    path: "/",
    maxAge: ACCESS_JWT_TTL_SECONDS,
  });
  response.cookies.set({
    name: REFRESH_COOKIE_NAME,
    value: newRefresh,
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime(),
    path: "/api/refresh",
    maxAge: REFRESH_JWT_TTL_SECONDS,
  });
  response.cookies.set({
    name: CSRF_COOKIE_NAME,
    value: csrfToken,
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
