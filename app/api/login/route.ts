import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  ACCESS_JWT_TTL_SECONDS,
  JWT_COOKIE_TTL_SECONDS,
  MAX_LOGIN_BODY_BYTES,
  REFRESH_COOKIE_NAME,
  REFRESH_JWT_TTL_SECONDS,
  isAccessControlConfigured,
  isProductionRuntime,
  resolveRoleFromToken,
} from "@/lib/access-control";
import {
  CSRF_COOKIE_MAX_AGE_SECONDS,
  CSRF_COOKIE_NAME,
  generateCsrfToken,
} from "@/lib/csrf-token";
import { isJwtSecretStrong, signJwt } from "@/lib/jwt";
import { clientKeyFromHeaders, consumeRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_LIMIT_WINDOW_MS = 60 * 1000;

type LoginPayload = { token?: unknown };

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

export async function POST(request: Request) {
  const clientKey = `login:${clientKeyFromHeaders(request.headers)}`;
  const rate = await consumeRateLimit(
    clientKey,
    LOGIN_RATE_LIMIT,
    LOGIN_RATE_LIMIT_WINDOW_MS,
  );

  if (!rate.allowed) {
    return NextResponse.json(
      { error: "rate-limited" },
      { status: 429, headers: rateLimitHeaders(rate) },
    );
  }

  if (!isAccessControlConfigured()) {
    return NextResponse.json(
      { error: "service-unavailable", message: "service configuration error" },
      { status: 503, headers: rateLimitHeaders(rate) },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_LOGIN_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload-too-large" },
      { status: 413, headers: rateLimitHeaders(rate) },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "invalid-payload" },
      { status: 400, headers: rateLimitHeaders(rate) },
    );
  }

  if (rawBody.length > MAX_LOGIN_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload-too-large" },
      { status: 413, headers: rateLimitHeaders(rate) },
    );
  }

  let payload: LoginPayload | null = null;
  try {
    payload = rawBody ? (JSON.parse(rawBody) as LoginPayload) : null;
  } catch {
    return NextResponse.json(
      { error: "invalid-payload" },
      { status: 400, headers: rateLimitHeaders(rate) },
    );
  }

  const token = typeof payload?.token === "string" ? payload.token : "";
  const role = resolveRoleFromToken(token);
  if (!role) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: rateLimitHeaders(rate) },
    );
  }

  const jwtSecret = process.env.CLAPBOARD_JWT_SECRET;
  const useJwt = isJwtSecretStrong(jwtSecret);
  const accessValue = useJwt
    ? await signJwt(
        { role, type: "access" },
        jwtSecret as string,
        ACCESS_JWT_TTL_SECONDS,
      )
    : token;
  const accessMaxAge = useJwt
    ? ACCESS_JWT_TTL_SECONDS
    : ACCESS_COOKIE_MAX_AGE_SECONDS;
  const refreshValue = useJwt
    ? await signJwt(
        { role, type: "refresh" },
        jwtSecret as string,
        REFRESH_JWT_TTL_SECONDS,
      )
    : null;
  void JWT_COOKIE_TTL_SECONDS; // 後方互換用に残す

  const csrfToken = generateCsrfToken();
  const response = NextResponse.json(
    { ok: true, role, csrfToken, mode: useJwt ? "jwt" : "legacy" },
    { status: 200, headers: rateLimitHeaders(rate) },
  );
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: accessValue,
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime(),
    path: "/",
    maxAge: accessMaxAge,
  });
  if (useJwt && refreshValue) {
    response.cookies.set({
      name: REFRESH_COOKIE_NAME,
      value: refreshValue,
      httpOnly: true,
      sameSite: "lax",
      secure: isProductionRuntime(),
      path: "/api/refresh",
      maxAge: REFRESH_JWT_TTL_SECONDS,
    });
  }
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
