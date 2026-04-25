export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  windowMs: number;
};

type Bucket = {
  windowStart: number;
  count: number;
};

const globalScope = globalThis as typeof globalThis & {
  __clapboardRateLimit?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  if (!globalScope.__clapboardRateLimit) {
    globalScope.__clapboardRateLimit = new Map<string, Bucket>();
  }
  return globalScope.__clapboardRateLimit;
}

const MAX_TRACKED_KEYS = 1024;
const FALLBACK_KEY_PREFIX = "anon:";
const FALLBACK_LIMIT_DIVISOR = 4;

function pruneStore(store: Map<string, Bucket>, now: number, windowMs: number) {
  for (const [key, bucket] of store) {
    if (now - bucket.windowStart >= windowMs) {
      store.delete(key);
    }
  }

  while (store.size >= MAX_TRACKED_KEYS) {
    const oldestKey = store.keys().next().value;
    if (oldestKey === undefined) break;
    store.delete(oldestKey);
  }
}

/**
 * Edge runtime のメモリ上で sliding window 風カウンタを管理する簡易レート制限。
 *
 * 制約（運用上の前提）:
 * - 同一 isolate 内でも `get → set` は原子的ではないため、許容上限を瞬間的に
 *   1〜2 回超える可能性がある（"approximate"）。厳密なカウントが必要な場合は
 *   分散ストア（Vercel KV / Redis 等）に置き換える。
 * - Edge Function インスタンス／リージョン切替えで状態が消える。
 * - Map の肥大化対策として、ウィンドウ切れと FIFO 風のハードキャップで剪定する。
 */
export function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitDecision {
  const store = getStore();
  pruneStore(store, now, windowMs);

  const effectiveLimit = key.startsWith(FALLBACK_KEY_PREFIX)
    ? Math.max(1, Math.floor(limit / FALLBACK_LIMIT_DIVISOR))
    : limit;

  const bucket = store.get(key);
  if (!bucket || now - bucket.windowStart >= windowMs) {
    store.set(key, { windowStart: now, count: 1 });
    return {
      allowed: true,
      remaining: Math.max(0, effectiveLimit - 1),
      retryAfterSeconds: 0,
      limit: effectiveLimit,
      windowMs,
    };
  }

  if (bucket.count >= effectiveLimit) {
    const elapsed = now - bucket.windowStart;
    const retryAfterMs = Math.max(0, windowMs - elapsed);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
      limit: effectiveLimit,
      windowMs,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, effectiveLimit - bucket.count),
    retryAfterSeconds: 0,
    limit: effectiveLimit,
    windowMs,
  };
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
