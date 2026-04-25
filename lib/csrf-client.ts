import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/csrf-token";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function readCsrfTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split(";")) {
    const [rawName, ...rest] = part.split("=");
    if (rawName?.trim() === CSRF_COOKIE_NAME) {
      const value = decodeURIComponent(rest.join("=").trim());
      return value.length > 0 ? value : null;
    }
  }
  return null;
}

async function ensureCsrfToken(): Promise<string | null> {
  const cached = readCsrfTokenFromCookie();
  if (cached) return cached;
  try {
    const response = await fetch("/api/csrf", {
      method: "GET",
      credentials: "same-origin",
      headers: { accept: "application/json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { token?: unknown };
    return typeof data.token === "string" ? data.token : null;
  } catch {
    return null;
  }
}

export async function fetchWithCsrf(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return fetch(input, init);
  }

  const token = await ensureCsrfToken();
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set(CSRF_HEADER_NAME, token);
  }
  return fetch(input, { ...init, headers });
}
