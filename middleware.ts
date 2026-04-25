import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  hasAnyConfiguredRole,
  methodRequiresAdmin,
  resolveRole,
  sanitizeRedirectPath,
  type Role,
} from "@/lib/access-token";
import { evaluateCsrf } from "@/lib/csrf";

const PROTECTED_PAGE_PREFIXES: string[] = [];
const PROTECTED_PAGE_PATHS = new Set<string>();
const PROTECTED_API_PREFIXES = ["/api/"];
const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/login",
  "/api/logout",
]);

const SERVICE_UNAVAILABLE_MESSAGE = "service configuration error";
const UNAUTHORIZED_MESSAGE = "unauthorized";
const FORBIDDEN_MESSAGE = "forbidden";

function extractBearer(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const value = header.slice(7).trim();
  return value.length > 0 ? value : null;
}

function hasNonEmptyBearer(request: NextRequest) {
  return extractBearer(request) !== null;
}

function firstHeaderValue(request: NextRequest, name: string): string | null {
  const raw = request.headers.get(name);
  if (!raw) return null;
  const value = raw.split(",")[0]?.trim();
  return value && value.length > 0 ? value : null;
}

function buildForwardedRequest(request: NextRequest) {
  const forwardedProto = firstHeaderValue(request, "x-forwarded-proto");
  const forwardedHost =
    firstHeaderValue(request, "x-forwarded-host") ??
    firstHeaderValue(request, "host");
  const proto = forwardedProto ?? request.nextUrl.protocol.replace(":", "");
  const host = forwardedHost ?? request.nextUrl.host;
  const url = `${proto}://${host}${request.nextUrl.pathname}${request.nextUrl.search}`;
  return {
    method: request.method,
    url,
    headers: request.headers,
  };
}

function resolveRequestRole(request: NextRequest): Role | null {
  const cookieValue = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const cookieRole = cookieValue ? resolveRole(cookieValue) : null;
  if (cookieRole) return cookieRole;

  const bearer = extractBearer(request);
  return bearer ? resolveRole(bearer) : null;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isProduction = process.env.NODE_ENV === "production";

  const isApiRoute = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isProtectedPage =
    PROTECTED_PAGE_PATHS.has(pathname) ||
    PROTECTED_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  const isProtectedApi = isApiRoute && !PUBLIC_API_PATHS.has(pathname);

  if (!isProtectedPage && !isApiRoute) {
    return NextResponse.next();
  }

  if (isApiRoute && !hasNonEmptyBearer(request)) {
    const csrf = evaluateCsrf(buildForwardedRequest(request));
    if (!csrf.ok) {
      return NextResponse.json(
        { error: FORBIDDEN_MESSAGE, reason: csrf.reason },
        {
          status: 403,
          headers: {
            "cache-control": "no-store",
            vary: "origin",
          },
        },
      );
    }
  }

  if (!isProtectedPage && !isProtectedApi) {
    return NextResponse.next();
  }

  if (!hasAnyConfiguredRole()) {
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

  const role = resolveRequestRole(request);

  if (!role) {
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

  if (isProtectedApi && methodRequiresAdmin(request.method) && role !== "admin") {
    return NextResponse.json(
      { error: FORBIDDEN_MESSAGE, reason: "role-insufficient" },
      {
        status: 403,
        headers: {
          "cache-control": "no-store",
        },
      },
    );
  }

  const response = NextResponse.next();
  response.headers.set("x-clapboard-role", role);
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
