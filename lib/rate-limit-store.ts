export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  limit: number;
  windowMs: number;
};

export type RateLimitStoreKind = "memory" | "upstash" | "upstash-with-fallback";

export interface RateLimitStore {
  readonly kind: RateLimitStoreKind;
  consume(
    key: string,
    limit: number,
    windowMs: number,
    now?: number,
  ): Promise<RateLimitDecision>;
}

export const FALLBACK_KEY_PREFIX = "anon:";
export const FALLBACK_LIMIT_DIVISOR = 4;

export function effectiveLimitFor(key: string, limit: number): number {
  return key.startsWith(FALLBACK_KEY_PREFIX)
    ? Math.max(1, Math.floor(limit / FALLBACK_LIMIT_DIVISOR))
    : limit;
}

const MAX_TRACKED_KEYS = 1024;

type Bucket = {
  windowStart: number;
  count: number;
};

const globalScope = globalThis as typeof globalThis & {
  __clapboardRateLimit?: Map<string, Bucket>;
};

function getMemoryMap(): Map<string, Bucket> {
  if (!globalScope.__clapboardRateLimit) {
    globalScope.__clapboardRateLimit = new Map<string, Bucket>();
  }
  return globalScope.__clapboardRateLimit;
}

function pruneMemory(store: Map<string, Bucket>, now: number, windowMs: number) {
  for (const [key, bucket] of store) {
    if (now - bucket.windowStart >= windowMs) {
      store.delete(key);
    }
  }

  while (store.size >= MAX_TRACKED_KEYS) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

/**
 * Edge runtime のメモリ上で sliding window 風カウンタを管理する簡易ストア。
 * 同一 isolate 内でも `get → set` は原子的ではないため、許容上限を瞬間的に
 * 1〜2 回超える可能性がある（"approximate"）。Edge instance/region 間で
 * 状態は共有されない。厳密性が要る場合は Upstash KV に切替える。
 */
export class MemoryRateLimitStore implements RateLimitStore {
  readonly kind: RateLimitStoreKind = "memory";

  async consume(
    key: string,
    limit: number,
    windowMs: number,
    now: number = Date.now(),
  ): Promise<RateLimitDecision> {
    const store = getMemoryMap();
    pruneMemory(store, now, windowMs);

    const limitForKey = effectiveLimitFor(key, limit);
    const bucket = store.get(key);

    if (!bucket || now - bucket.windowStart >= windowMs) {
      store.set(key, { windowStart: now, count: 1 });
      return {
        allowed: true,
        remaining: Math.max(0, limitForKey - 1),
        retryAfterSeconds: 0,
        limit: limitForKey,
        windowMs,
      };
    }

    if (bucket.count >= limitForKey) {
      const elapsed = now - bucket.windowStart;
      const retryAfterMs = Math.max(0, windowMs - elapsed);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
        limit: limitForKey,
        windowMs,
      };
    }

    bucket.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, limitForKey - bucket.count),
      retryAfterSeconds: 0,
      limit: limitForKey,
      windowMs,
    };
  }
}

type UpstashPipelineResponse = Array<{ result: unknown; error?: string }>;

/**
 * Upstash Redis (Vercel KV / Upstash KV) の REST API を fetch でアトミックに
 * 操作する分散レート制限ストア。
 *
 * - INCR でカウントを単調増加させる（atomic）
 * - 初回挿入時のみ PEXPIRE NX で TTL を設定し、ウィンドウを固定
 * - 残り TTL は PTTL から取得し Retry-After に流用
 *
 * Edge instance/region をまたいで一貫したカウントが取れる。リクエスト失敗時は
 * フォールバックとして MemoryRateLimitStore を使い、503 ではなくサービス継続
 * を優先する設計。
 */
export class UpstashRateLimitStore implements RateLimitStore {
  readonly kind: RateLimitStoreKind = "upstash-with-fallback";

  private readonly fallback = new MemoryRateLimitStore();

  constructor(private readonly restUrl: string, private readonly restToken: string) {}

  async consume(
    key: string,
    limit: number,
    windowMs: number,
    now: number = Date.now(),
  ): Promise<RateLimitDecision> {
    try {
      return await this.consumeRemote(key, limit, windowMs);
    } catch {
      return this.fallback.consume(key, limit, windowMs, now);
    }
  }

  private async consumeRemote(
    key: string,
    limit: number,
    windowMs: number,
  ): Promise<RateLimitDecision> {
    const namespacedKey = `clap:rl:${key}`;
    const limitForKey = effectiveLimitFor(key, limit);

    const response = await fetch(`${this.restUrl.replace(/\/+$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.restToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", namespacedKey],
        ["PEXPIRE", namespacedKey, String(windowMs), "NX"],
        ["PTTL", namespacedKey],
      ]),
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) {
      throw new Error(`upstash status ${response.status}`);
    }

    const payload = (await response.json()) as UpstashPipelineResponse;
    const incrResult = payload[0]?.result;
    const ttlResult = payload[2]?.result;

    if (typeof incrResult !== "number") {
      throw new Error("upstash invalid response");
    }

    const count = incrResult;
    const ttlMs = typeof ttlResult === "number" && ttlResult > 0 ? ttlResult : windowMs;

    if (count > limitForKey) {
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil(ttlMs / 1000),
        limit: limitForKey,
        windowMs,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limitForKey - count),
      retryAfterSeconds: 0,
      limit: limitForKey,
      windowMs,
    };
  }
}

let resolvedStore: RateLimitStore | null = null;

export function getRateLimitStore(): RateLimitStore {
  if (resolvedStore) return resolvedStore;

  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? "";
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

  if (url && token) {
    resolvedStore = new UpstashRateLimitStore(url, token);
  } else {
    resolvedStore = new MemoryRateLimitStore();
  }
  return resolvedStore;
}

export function __resetRateLimitStoreForTests() {
  resolvedStore = null;
}
