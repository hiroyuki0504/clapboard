import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "clapbot-auth";

/** HMAC-SHA256 で署名されたセッション値を検証する */
export function verifySessionValue(value: string): boolean {
  const secret = process.env.CLAPBOARD_SESSION_SECRET;
  if (!secret) return false;

  // format: "<payload>.<signature>"
  const dot = value.lastIndexOf(".");
  if (dot < 0) return false;

  const payload = value.slice(0, dot);
  const provided = value.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(provided, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

/** ログイン成功時に Cookie にセットするセッション値を生成する */
export function createSessionValue(): string {
  const secret = process.env.CLAPBOARD_SESSION_SECRET ?? "";
  const payload = Date.now().toString(36);
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

const PUBLIC_PATHS = new Set([
  "/api/health",
  "/api/login",
  "/api/logout",
  "/login",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (!verifySessionValue(sessionValue)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "cache-control": "no-store" } },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
