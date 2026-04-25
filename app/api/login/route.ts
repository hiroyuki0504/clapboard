import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  MAX_LOGIN_BODY_BYTES,
  isAccessControlConfigured,
  isProductionRuntime,
  verifyAccessToken,
} from "@/lib/access-control";

export const dynamic = "force-dynamic";

type LoginPayload = { token?: unknown };

const RESPONSE_HEADERS = { "cache-control": "no-store" } as const;

export async function POST(request: Request) {
  if (!isAccessControlConfigured()) {
    return NextResponse.json(
      { error: "service-unavailable", message: "service configuration error" },
      { status: 503, headers: RESPONSE_HEADERS },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_LOGIN_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload-too-large" },
      { status: 413, headers: RESPONSE_HEADERS },
    );
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json(
      { error: "invalid-payload" },
      { status: 400, headers: RESPONSE_HEADERS },
    );
  }

  if (rawBody.length > MAX_LOGIN_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload-too-large" },
      { status: 413, headers: RESPONSE_HEADERS },
    );
  }

  let payload: LoginPayload | null = null;
  try {
    payload = rawBody ? (JSON.parse(rawBody) as LoginPayload) : null;
  } catch {
    return NextResponse.json(
      { error: "invalid-payload" },
      { status: 400, headers: RESPONSE_HEADERS },
    );
  }

  const token = typeof payload?.token === "string" ? payload.token : "";
  if (!verifyAccessToken(token)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: RESPONSE_HEADERS },
    );
  }

  const response = NextResponse.json(
    { ok: true },
    { status: 200, headers: RESPONSE_HEADERS },
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
