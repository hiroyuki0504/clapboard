import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  isAccessTokenStrong,
  sanitizeRedirectPath,
  timingSafeEquals,
} from "@/lib/access-token";

const PROTECTED_PAGE_PREFIXES = ["/projects", "/code-review"];
const PROTECTED_PAGE_PATHS = new Set(["/"]);
const PROTECTED_API_PREFIXES = ["/api/"];
const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/login",
  "/api/logout",
]);

const SERVICE_UNAVAILABLE_MESSAGE = "service configuration error";
const UNAUTHORIZED_MESSAGE = "unauthorized";

function extractBearer(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  return header.slice(7).trim();
}

function isAuthorized(request: NextRequest, expected: string) {
  const cookieValue = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  if (cookieValue && timingSafeEquals(cookieValue, expected)) {
    return true;
  }

  const bearer = extractBearer(request);
  if (bearer && timingSafeEquals(bearer, expected)) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const expected = process.env.CLAPBOARD_ACCESS_TOKEN;
  const isProduction = process.env.NODE_ENV === "production";

  const isProtectedPage =
    PROTECTED_PAGE_PATHS.has(pathname) ||
    PROTECTED_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  const isProtectedApi =
    PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) &&
    !PUBLIC_API_PATHS.has(pathname);

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!isAccessTokenStrong(expected)) {
    if (isProduction) {
      if (isProtectedApi) {
        return NextResponse.json(
          { error: "service-unavailable", message: SERVICE_UNAVAILABLE_MESSAGE },
          { status: 503, headers: { "cache-control": "no-store" } },
        );
      }
      return new NextResponse(SERVICE_UNAVAILABLE_MESSAGE, {
        status: 503,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }
    return NextResponse.next();
  }

  if (isAuthorized(request, expected as string)) {
    return NextResponse.next();
  }

  if (isProtectedApi) {
    return NextResponse.json(
      { error: UNAUTHORIZED_MESSAGE },
      {
        status: 401,
        headers: {
          "WWW-Authenticate": "Bearer",
          "cache-control": "no-store",
        },
      },
    );
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";
  loginUrl.searchParams.set("from", sanitizeRedirectPath(`${pathname}${search}`));
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/projects/:path*", "/code-review/:path*", "/api/:path*"],
};
