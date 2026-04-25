import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "clapbot-auth";

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

const PUBLIC_PATHS = new Set([
  "/api/health",
  "/api/login",
  "/api/logout",
  "/login",
]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const sessionValue = request.cookies.get(SESSION_COOKIE)?.value ?? "";
  if (!(await verifySessionValue(sessionValue))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: { "cache-control": "no-store" } },
      );
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
