import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  hasAnyConfiguredCredential,
  isProductionRuntime,
  resolveRoleFromSecret,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

const RESPONSE_HEADERS = { "cache-control": "no-store" } as const;
const MAX_LOGIN_BODY_BYTES = 4 * 1024;

type LoginPayload = {
  password?: unknown;
  token?: unknown;
};

function unauthorized() {
  return NextResponse.json(
    { error: "unauthorized" },
    { status: 401, headers: RESPONSE_HEADERS },
  );
}

export async function POST(request: Request) {
  if (!hasAnyConfiguredCredential()) {
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

  let payload: LoginPayload;
  try {
    payload = (await request.json()) as LoginPayload;
  } catch {
    return NextResponse.json(
      { error: "invalid-payload" },
      { status: 400, headers: RESPONSE_HEADERS },
    );
  }

  const secret =
    typeof payload.password === "string"
      ? payload.password
      : typeof payload.token === "string"
        ? payload.token
        : "";
  const role = resolveRoleFromSecret(secret);

  if (!role) {
    return unauthorized();
  }

  const response = NextResponse.json(
    { ok: true, role },
    { status: 200, headers: RESPONSE_HEADERS },
  );
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: secret,
    httpOnly: true,
    sameSite: "lax",
    secure: isProductionRuntime(),
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS,
  });
  return response;
}
