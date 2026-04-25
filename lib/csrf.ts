const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const ALLOWED_FETCH_SITES = new Set(["same-origin", "same-site", "none"]);

type CsrfRequest = {
  method: string;
  url: string;
  headers: Headers;
};

export type CsrfReason =
  | "missing-origin"
  | "cross-origin"
  | "cross-site-fetch";

export type CsrfDecision = { ok: true } | { ok: false; reason: CsrfReason };

export type CsrfOptions = {
  /**
   * GET / HEAD / OPTIONS にも CSRF 検証を強制する。副作用ある GET API を追加
   * したときに有効化する。デフォルト false（ブラウザが Origin を付けない GET を
   * 許容）。
   */
  enforceOnGet?: boolean;
};

export function evaluateCsrf(
  request: CsrfRequest,
  options: CsrfOptions = {},
): CsrfDecision {
  const { enforceOnGet = false } = options;
  const method = request.method.toUpperCase();

  if (!enforceOnGet && SAFE_METHODS.has(method)) {
    return { ok: true };
  }

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && !ALLOWED_FETCH_SITES.has(fetchSite.toLowerCase())) {
    return { ok: false, reason: "cross-site-fetch" };
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const targetOrigin = safeOrigin(request.url);

  if (origin) {
    if (!targetOrigin || origin !== targetOrigin) {
      return { ok: false, reason: "cross-origin" };
    }
    return { ok: true };
  }

  if (referer) {
    const refererOrigin = safeOrigin(referer);
    if (!targetOrigin || refererOrigin !== targetOrigin) {
      return { ok: false, reason: "cross-origin" };
    }
    return { ok: true };
  }

  return { ok: false, reason: "missing-origin" };
}

function safeOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}
