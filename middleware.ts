import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE_NAME,
  hasAnyConfiguredCredential,
  isDevAuthBypassEnabled,
  methodRequiresAdmin,
  resolveRoleFromSecret,
  roleAtLeast,
  sanitizeRedirectPath,
  type Role,
} from "@/lib/auth";

const PROTECTED_PAGE_PATHS = new Set(["/"]);
const PROTECTED_PAGE_PREFIXES = [
  "/projects",
  "/code-review",
  "/graph",
  "/command",
  "/timeline",
];
const PUBLIC_API_PATHS = new Set(["/api/health", "/api/login", "/api/logout"]);

const SERVICE_UNAVAILABLE_MESSAGE = "service configuration error";

function getRequiredPageRole(pathname: string): Role {
  return pathname === "/code-review" || pathname.startsWith("/code-review/")
    ? "admin"
    : "viewer";
}

function getRequiredApiRole(pathname: string, method: string): Role {
  if (pathname === "/api/code-review") {
    return "admin";
  }
  return methodRequiresAdmin(method) ? "admin" : "viewer";
}

function extractBearer(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const value = authorization.slice(7).trim();
  return value.length > 0 ? value : null;
}

function resolveRequestRole(request: NextRequest) {
  return (
    resolveRoleFromSecret(request.cookies.get(ACCESS_COOKIE_NAME)?.value) ??
    resolveRoleFromSecret(extractBearer(request))
  );
}

function isProtectedPage(pathname: string) {
  return (
    PROTECTED_PAGE_PATHS.has(pathname) ||
    PROTECTED_PAGE_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

function unavailableResponse(isApi: boolean) {
  if (isApi) {
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

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const apiRoute = pathname.startsWith("/api/");
  const protectedApi = apiRoute && !PUBLIC_API_PATHS.has(pathname);
  const protectedPage = isProtectedPage(pathname);

  if (!protectedApi && !protectedPage) {
    return NextResponse.next();
  }

  if (isDevAuthBypassEnabled()) {
    return NextResponse.next();
  }

  if (!hasAnyConfiguredCredential()) {
    return unavailableResponse(protectedApi);
  }

  const role = resolveRequestRole(request);
  if (!role) {
    if (protectedApi) {
      return NextResponse.json(
        { error: "unauthorized" },
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

  const requiredRole = protectedApi
    ? getRequiredApiRole(pathname, request.method)
    : getRequiredPageRole(pathname);

  if (!roleAtLeast(role, requiredRole)) {
    if (protectedApi) {
      return NextResponse.json(
        { error: "forbidden", reason: "role-insufficient" },
        { status: 403, headers: { "cache-control": "no-store" } },
      );
    }
    return new NextResponse("forbidden", {
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
  matcher: [
    "/",
    "/projects/:path*",
    "/code-review/:path*",
    "/graph/:path*",
    "/command/:path*",
    "/timeline/:path*",
    "/api/:path*",
  ],
};
