import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  MAX_LOGIN_BODY_BYTES,
  isAccessControlConfigured,
  isProductionRuntime,
  verifyAccessToken,
} from "@/lib/access-control";
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
  const rate = consumeRateLimit(
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
  if (!verifyAccessToken(token)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: rateLimitHeaders(rate) },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: rateLimitHeaders(rate) },
  );
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime(),
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
