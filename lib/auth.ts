export const ACCESS_COOKIE_NAME = "clapboard_access";
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const DEV_DEFAULT_PASSWORD = "password";

export type Role = "admin" | "viewer";

export const SAFE_HTTP_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function readSecret(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function shouldUseSecureAccessCookie(request: Request) {
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();
  if (forwardedProto) {
    return forwardedProto === "https";
  }

  const forwarded = request.headers.get("forwarded");
  const forwardedHeaderProto = forwarded
    ?.split(",")[0]
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith("proto="))
    ?.slice("proto=".length)
    .replace(/^"|"$/g, "")
    .toLowerCase();
  if (forwardedHeaderProto) {
    return forwardedHeaderProto === "https";
  }

  return new URL(request.url).protocol === "https:";
}

export function isDevAuthBypassEnabled() {
  return process.env.CLAPBOARD_DEV_AUTH_BYPASS === "1" && !isProductionRuntime();
}

function getConfiguredCredentials(): Array<{ role: Role; secret: string }> {
  const adminSecret =
    readSecret("CLAPBOARD_PASSWORD") ??
    readSecret("CLAPBOARD_ACCESS_TOKEN") ??
    (isProductionRuntime() ? null : DEV_DEFAULT_PASSWORD);
  const viewerSecret = readSecret("CLAPBOARD_VIEWER_TOKEN");
  const credentials: Array<{ role: Role; secret: string }> = [];

  if (adminSecret) {
    credentials.push({ role: "admin", secret: adminSecret });
  }
  if (viewerSecret) {
    credentials.push({ role: "viewer", secret: viewerSecret });
  }
  return credentials;
}

export function hasAnyConfiguredCredential() {
  return getConfiguredCredentials().length > 0;
}

export function timingSafeEquals(a: string, b: string) {
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

export function resolveRoleFromSecret(candidate: string | undefined | null): Role | null {
  if (!candidate) return null;

  let matchedRole: Role | null = null;
  for (const credential of getConfiguredCredentials()) {
    const matched = timingSafeEquals(credential.secret, candidate);
    if (matched && matchedRole === null) {
      matchedRole = credential.role;
    }
  }
  return matchedRole;
}

export function roleAtLeast(role: Role | null, required: Role) {
  if (!role) return false;
  if (required === "viewer") {
    return role === "admin" || role === "viewer";
  }
  return role === "admin";
}

export function methodRequiresAdmin(method: string) {
  return !SAFE_HTTP_METHODS.has(method.toUpperCase());
}

export function sanitizeRedirectPath(value: string | undefined | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  if (value.length > 240) {
    return "/";
  }
  return value;
}
