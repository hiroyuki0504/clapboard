import {
  FALLBACK_KEY_PREFIX,
  getRateLimitStore,
  type RateLimitDecision,
} from "@/lib/rate-limit-store";

export type { RateLimitDecision };

export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<RateLimitDecision> {
  const store = getRateLimitStore();
  return store.consume(key, limit, windowMs, now);
}

function pickRightmostFromXff(value: string): string | null {
  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  return parts[parts.length - 1] ?? null;
}

/**
 * 信頼境界が「Vercel/エッジ プロキシ → 自分のアプリ」の構成を前提に、
 * クライアント IP を抽出する。プロキシが追記する右端の値を優先し、
 * クライアント由来になり得る左端は信用しない。
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for");
  if (vercel) {
    const right = pickRightmostFromXff(vercel);
    if (right) return right;
  }

  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const right = pickRightmostFromXff(xff);
    if (right) return right;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  return `${FALLBACK_KEY_PREFIX}headerless`;
}
