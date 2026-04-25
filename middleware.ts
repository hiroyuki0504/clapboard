import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  isDevAuthBypass,
  verifySessionValue,
} from "@/lib/session";

export {
  SESSION_COOKIE,
  SESSION_MAX_AGE_MS,
  createSessionValue,
  verifySessionValue,
} from "@/lib/session";

const PUBLIC_PATHS = new Set([
  "/api/health",
  "/api/login",
  "/api/logout",
  "/login",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (isDevAuthBypass()) {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (!(await verifySessionValue(sessionValue))) {
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
