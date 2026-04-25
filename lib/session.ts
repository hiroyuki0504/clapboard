export const SESSION_COOKIE = "clapbot-auth";

/** セッション Cookie の有効期限 (7日)。README / login の Max-Age と一致させる */
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** クライアントとの軽微な時計ズレを許容する余白 */
const SESSION_CLOCK_SKEW_MS = 60 * 1000;

const encoder = new TextEncoder();

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> | null {
  if (hex.length % 2 !== 0) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    const byte = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) return null;
    bytes[i] = byte;
  }
  return bytes as Uint8Array<ArrayBuffer>;
}

/** HMAC-SHA256 で署名されたセッション値を検証する (Edge Runtime 対応) */
export async function verifySessionValue(value: string): Promise<boolean> {
  const secret = process.env.CLAPBOARD_SESSION_SECRET;
  if (!secret) return false;

  const dot = value.lastIndexOf(".");
  if (dot < 0) return false;

  const payload = value.slice(0, dot);
  const provided = value.slice(dot + 1);
  const sigBytes = hexToBytes(provided);
  if (!sigBytes) return false;

  // payload は base36 で encode した発行時刻 (ms)。改ざん検知前に範囲チェックして
  // 偽造値で例外パスを誘発しないようにし、署名検証通過時のみ採用する。
  const issuedAt = parseInt(payload, 36);
  if (!Number.isFinite(issuedAt) || issuedAt <= 0) return false;
  if (issuedAt.toString(36) !== payload) return false; // 数値再変換不一致 (前ゼロ等) を弾く
  const now = Date.now();
  if (issuedAt > now + SESSION_CLOCK_SKEW_MS) return false; // 未来発行
  if (now - issuedAt > SESSION_MAX_AGE_MS) return false; // 7日超過

  try {
    const key = await importHmacKey(secret);
    return await crypto.subtle.verify(
      "HMAC",
      key,
      sigBytes,
      encoder.encode(payload),
    );
  } catch {
    return false;
  }
}

/** ログイン成功時に Cookie にセットするセッション値を生成する */
export async function createSessionValue(): Promise<string> {
  const secret = process.env.CLAPBOARD_SESSION_SECRET ?? "";
  const payload = Date.now().toString(36);
  const key = await importHmacKey(secret);
  const sigBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload),
  );
  const sigHex = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}.${sigHex}`;
}

/** dev での認証 bypass フラグ。production では無視される */
export function isDevAuthBypass(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.CLAPBOARD_DEV_AUTH_BYPASS === "1"
  );
}
