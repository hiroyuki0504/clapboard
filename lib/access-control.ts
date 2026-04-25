import "server-only";

import { cookies, headers } from "next/headers";
import {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  MAX_LOGIN_BODY_BYTES,
  MIN_ACCESS_TOKEN_LENGTH,
  isAccessTokenStrong,
  sanitizeRedirectPath,
  timingSafeEquals,
} from "@/lib/access-token";

export {
  ACCESS_COOKIE_MAX_AGE_SECONDS,
  ACCESS_COOKIE_NAME,
  MAX_LOGIN_BODY_BYTES,
  MIN_ACCESS_TOKEN_LENGTH,
  isAccessTokenStrong,
  sanitizeRedirectPath,
  timingSafeEquals,
};

const accessToken = process.env.CLAPBOARD_ACCESS_TOKEN;

export function isAccessControlConfigured() {
  return isAccessTokenStrong(accessToken);
}

export function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

export function verifyAccessToken(candidate: string | undefined | null) {
  if (!accessToken || !candidate || typeof candidate !== "string") {
    return false;
  }

  return timingSafeEquals(accessToken, candidate);
}

function extractBearer(header: string | null) {
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

export async function canRenderProtectedShell() {
  if (!isAccessControlConfigured()) {
    return !isProductionRuntime();
  }

  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const cookieValue = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (verifyAccessToken(cookieValue)) {
    return true;
  }

  return verifyAccessToken(extractBearer(headerStore.get("authorization")));
}
