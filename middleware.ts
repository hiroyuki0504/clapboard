import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  SAFE_HTTP_METHODS,
  hasAnyConfiguredRole,
  isProductionRuntime,
  methodRequiresAdmin,
  resolveRole,
  roleAtLeast,
  sanitizeRedirectPath,
  type Role,
} from "@/lib/access-token";
import { evaluateCsrf } from "@/lib/csrf";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  verifyDoubleSubmit,
} from "@/lib/csrf-token";

const PROTECTED_PAGE_PREFIXES: string[] = [];
const PROTECTED_PAGE_PATHS = new Set<string>();
const PROTECTED_API_PREFIXES = ["/api/"];
const PUBLIC_API_PATHS = new Set([
  "/api/health",
  "/api/login",
  "/api/logout",
  "/api/csrf",
]);
const CSRF_TOKEN_BYPASS_API_PATHS = new Set(["/api/login", "/api/csrf"]);

const SERVICE_UNAVAILABLE_MESSAGE = "service configuration error";
const UNAUTHORIZED_MESSAGE = "unauthorized";
const FORBIDDEN_MESSAGE = "forbidden";

function getRequiredPageRole(pathname: string): Role {
  if (pathname === "/code-review" || pathname.startsWith("/code-review/")) {
    return "admin";
  }
  return "viewer";
}

function getRequiredApiRole(pathname: string, method: string): Role {
  if (pathname === "/api/code-review") {
    return "admin";
  }
  return methodRequiresAdmin(method) ? "admin" : "viewer";
}

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
  const isProduction = isProductionRuntime();

  const isApiRoute = PROTECTED_API_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isProtectedPage =
    PROTECTED_PAGE_PATHS.has(pathname) ||
    PROTECTED_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    );
  const isProtectedApi = isApiRoute && !PUBLIC_API_PATHS.has(pathname);
  const requiredPageRole = isProtectedPage ? getRequiredPageRole(pathname) : null;
  const requiredApiRole = isProtectedApi
    ? getRequiredApiRole(pathname, request.method)
    : null;

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

    const isWriteMethod = !SAFE_HTTP_METHODS.has(request.method.toUpperCase());
    if (isWriteMethod && !CSRF_TOKEN_BYPASS_API_PATHS.has(pathname)) {
      const headerToken = request.headers.get(CSRF_HEADER_NAME);
      const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value ?? null;
      if (!verifyDoubleSubmit(headerToken, cookieToken)) {
        return NextResponse.json(
          { error: FORBIDDEN_MESSAGE, reason: "csrf-token-mismatch" },
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

  if (
    (requiredPageRole && !roleAtLeast(role, requiredPageRole)) ||
    (requiredApiRole && !roleAtLeast(role, requiredApiRole))
  ) {
    if (isProtectedApi) {
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
    return new NextResponse(FORBIDDEN_MESSAGE, {
      status: 403,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("x-clapboard-role", role);
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};
