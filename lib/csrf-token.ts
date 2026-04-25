import { timingSafeEquals } from "@/lib/access-token";

export const CSRF_COOKIE_NAME = "clapboard_csrf";
export const CSRF_HEADER_NAME = "x-csrf-token";
export const CSRF_TOKEN_BYTES = 32;
export const CSRF_TOKEN_MIN_LENGTH = 32;
export const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateCsrfToken(): string {
  const bytes = new Uint8Array(CSRF_TOKEN_BYTES);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

export function isCsrfTokenShape(value: string | undefined | null): value is string {
  return (
    typeof value === "string" &&
    value.length >= CSRF_TOKEN_MIN_LENGTH &&
    value.length <= 128 &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

export function verifyDoubleSubmit(
  headerValue: string | null,
  cookieValue: string | null,
): boolean {
  if (!isCsrfTokenShape(headerValue) || !isCsrfTokenShape(cookieValue)) {
    return false;
  }
  return timingSafeEquals(headerValue, cookieValue);
}
