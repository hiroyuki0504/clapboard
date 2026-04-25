import "server-only";

import { cookies, headers } from "next/headers";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  JWT_COOKIE_TTL_SECONDS,
  MAX_LOGIN_BODY_BYTES,
  MIN_ACCESS_TOKEN_LENGTH,
  hasAnyConfiguredRole,
  isAccessTokenStrong,
  isProductionRuntime,
  resolveRole,
  roleAtLeast,
  sanitizeRedirectPath,
  timingSafeEquals,
  type Role,
} from "@/lib/access-token";
import { isJwtSecretStrong, verifyJwt } from "@/lib/jwt";

export {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  JWT_COOKIE_TTL_SECONDS,
  MAX_LOGIN_BODY_BYTES,
  MIN_ACCESS_TOKEN_LENGTH,
  hasAnyConfiguredRole,
  isAccessTokenStrong,
  isProductionRuntime,
  resolveRole,
  roleAtLeast,
  sanitizeRedirectPath,
  timingSafeEquals,
};
export type { Role };

export function isAccessControlConfigured() {
  return hasAnyConfiguredRole();
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

async function resolveRoleFromValue(
  value: string | undefined | null,
): Promise<Role | null> {
  if (!value) return null;

  const jwtSecret = process.env.CLAPBOARD_JWT_SECRET;
  if (isJwtSecretStrong(jwtSecret) && value.split(".").length === 3) {
    const claims = await verifyJwt<{ role?: unknown }>(value, jwtSecret);
    if (claims) {
      const claimedRole = claims.role;
      if (claimedRole === "admin" || claimedRole === "viewer") {
        return claimedRole;
      }
      return null;
    }
  }
  return resolveRole(value);
}

export async function canRenderProtectedShell(required: Role = "viewer") {
  if (!isAccessControlConfigured()) {
    return !isProductionRuntime();
  }

  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const cookieRole = await resolveRoleFromValue(
    cookieStore.get(ACCESS_COOKIE_NAME)?.value,
  );
  if (roleAtLeast(cookieRole, required)) {
    return true;
  }

  const bearer = extractBearer(headerStore.get("authorization"));
  return roleAtLeast(await resolveRoleFromValue(bearer), required);
}
