import "server-only";

import { cookies, headers } from "next/headers";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  MAX_LOGIN_BODY_BYTES,
  MIN_ACCESS_TOKEN_LENGTH,
  hasAnyConfiguredRole,
  isAccessTokenStrong,
  resolveRole,
  roleAtLeast,
  sanitizeRedirectPath,
  timingSafeEquals,
  type Role,
} from "@/lib/access-token";

export {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  MAX_LOGIN_BODY_BYTES,
  MIN_ACCESS_TOKEN_LENGTH,
  hasAnyConfiguredRole,
  isAccessTokenStrong,
  resolveRole,
  roleAtLeast,
  sanitizeRedirectPath,
  timingSafeEquals,
};
export type { Role };

export function isAccessControlConfigured() {
  return hasAnyConfiguredRole();
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function verifyAccessToken(candidate: string | undefined | null) {
  return resolveRole(candidate) !== null;
}

export function resolveRoleFromToken(candidate: string | undefined | null): Role | null {
  return resolveRole(candidate);
}

function extractBearer(header: string | null) {
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const value = header.slice(7).trim();
  return value.length > 0 ? value : null;
}

export async function canRenderProtectedShell(required: Role = "viewer") {
  if (!isAccessControlConfigured()) {
    return !isProductionRuntime();
  }

  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const cookieRole = resolveRole(cookieStore.get(ACCESS_COOKIE_NAME)?.value);
  if (roleAtLeast(cookieRole, required)) {
    return true;
  }

  const bearer = extractBearer(headerStore.get("authorization"));
  return roleAtLeast(resolveRole(bearer), required);
}
