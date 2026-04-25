const ENCODER = new TextEncoder();
const DECODER = new TextDecoder();

const HEADER_B64 = base64urlEncode(
  ENCODER.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })),
);

export const MIN_JWT_SECRET_LENGTH = 32;

function base64urlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlDecode(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return null;
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? 0 : 4 - (padded.length % 4);
  try {
    const binary = atob(padded + "=".repeat(padding));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch {
    return null;
  }
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    ENCODER.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export type JwtClaims<T extends object = Record<string, unknown>> = T & {
  iat: number;
  exp: number;
};

export function isJwtSecretStrong(secret: string | undefined | null): secret is string {
  return typeof secret === "string" && secret.length >= MIN_JWT_SECRET_LENGTH;
}

export async function signJwt(
  payload: Record<string, unknown>,
  secret: string,
  ttlSeconds: number,
  now: number = Math.floor(Date.now() / 1000),
): Promise<string> {
  const fullPayload = { ...payload, iat: now, exp: now + ttlSeconds };
  const bodyB64 = base64urlEncode(
    ENCODER.encode(JSON.stringify(fullPayload)),
  );
  const data = `${HEADER_B64}.${bodyB64}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    ENCODER.encode(data),
  );
  return `${data}.${base64urlEncode(new Uint8Array(signature))}`;
}

export async function verifyJwt<T extends object = Record<string, unknown>>(
  token: string,
  secret: string,
  now: number = Math.floor(Date.now() / 1000),
): Promise<JwtClaims<T> | null> {
  if (typeof token !== "string" || token.length > 4096) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [headerB64, bodyB64, sigB64] = parts;
  if (!headerB64 || !bodyB64 || !sigB64) return null;

  let header: { alg?: unknown; typ?: unknown };
  try {
    const headerBytes = base64urlDecode(headerB64);
    if (!headerBytes) return null;
    header = JSON.parse(DECODER.decode(headerBytes));
  } catch {
    return null;
  }
  if (header.alg !== "HS256" || header.typ !== "JWT") return null;

  const sigBytes = base64urlDecode(sigB64);
  if (!sigBytes) return null;

  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes as unknown as BufferSource,
    ENCODER.encode(`${headerB64}.${bodyB64}`),
  );
  if (!valid) return null;

  let payload: Record<string, unknown>;
  try {
    const bodyBytes = base64urlDecode(bodyB64);
    if (!bodyBytes) return null;
    payload = JSON.parse(DECODER.decode(bodyBytes));
  } catch {
    return null;
  }

  if (typeof payload.exp !== "number" || payload.exp < now) return null;
  if (typeof payload.iat !== "number" || payload.iat > now + 60) return null;

  return payload as JwtClaims<T>;
}
