export const ACCESS_COOKIE_NAME = "clapboard_access";
export const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const MIN_ACCESS_TOKEN_LENGTH = 16;
export const MAX_LOGIN_BODY_BYTES = 4 * 1024;

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

export function sanitizeRedirectPath(value: string | undefined | null): string {
  if (!value || typeof value !== "string") {
    return "/code-review";
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/code-review";
  }

  const queryIndex = value.search(/[?#]/);
  const pathOnly = queryIndex === -1 ? value : value.slice(0, queryIndex);

  if (!pathOnly.startsWith("/") || pathOnly.length > 200) {
    return "/code-review";
  }

  return pathOnly;
}
