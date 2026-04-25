export const ACCESS_COOKIE_NAME = "clapboard_access";
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const MIN_ACCESS_TOKEN_LENGTH = 16;
export const MAX_LOGIN_BODY_BYTES = 4 * 1024;
export const JWT_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;
const NEXT_DEVELOPMENT_PHASE = "phase-development-server";

export type Role = "admin" | "viewer";

export const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function timingSafeEquals(a: string, b: string) {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.byteLength !== bBytes.byteLength) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < aBytes.byteLength; index += 1) {
    mismatch |= aBytes[index] ^ bBytes[index];
  }

  return mismatch === 0;
}

export function isAccessTokenStrong(value: string | undefined | null) {
  return typeof value === "string" && value.length >= MIN_ACCESS_TOKEN_LENGTH;
}

export function isDevelopmentRuntime() {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PHASE === NEXT_DEVELOPMENT_PHASE ||
    process.env.CLAPBOARD_DEV_AUTH_BYPASS === "1"
  );
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production" && !isDevelopmentRuntime();
}

export function sanitizeRedirectPath(value: string | undefined | null): string {
  if (!value || typeof value !== "string") {
    return "/";
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }

  const queryIndex = value.search(/[?#]/);
  const pathOnly = queryIndex === -1 ? value : value.slice(0, queryIndex);

  if (!pathOnly.startsWith("/") || pathOnly.length > 200) {
    return "/";
  }

  return pathOnly;
}

function getConfiguredTokens(): Array<{ role: Role; token: string }> {
  const adminToken = process.env.CLAPBOARD_ACCESS_TOKEN;
  const viewerToken = process.env.CLAPBOARD_VIEWER_TOKEN;
  const list: Array<{ role: Role; token: string }> = [];

  if (isAccessTokenStrong(adminToken)) {
    list.push({ role: "admin", token: adminToken as string });
  }
  if (isAccessTokenStrong(viewerToken)) {
    list.push({ role: "viewer", token: viewerToken as string });
  }
  return list;
}

export function hasAnyConfiguredRole() {
  return getConfiguredTokens().length > 0;
}

/**
 * Token から Role を逆引きする。複数 token が同一値だった場合は権限の高い admin
 * を優先する（admin → viewer の順で評価）。timing-safe 比較を必ず全候補に対して
 * 行うため、ヒット後も比較を続けて全体で定数時間に近づける。
 */
export function resolveRole(candidate: string | undefined | null): Role | null {
  if (typeof candidate !== "string" || candidate.length === 0) {
    return null;
  }

  let matched: Role | null = null;
  for (const entry of getConfiguredTokens()) {
    const hit = timingSafeEquals(entry.token, candidate);
    if (hit && matched === null) {
      matched = entry.role;
    }
  }
  return matched;
}

export function roleAtLeast(role: Role | null, required: Role): boolean {
  if (!role) return false;
  if (required === "viewer") {
    return role === "admin" || role === "viewer";
  }
  return role === "admin";
}

export function methodRequiresAdmin(method: string): boolean {
  return !SAFE_HTTP_METHODS.has(method.toUpperCase());
}
