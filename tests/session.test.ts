import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { test } from "node:test";

const outputRoot = path.resolve(process.cwd(), "out/test-build");
const requireFromOutput = createRequire(
  path.join(outputRoot, "tests", "session.test.js"),
);

type SessionModule = {
  createSessionValue: () => Promise<string>;
  verifySessionValue: (value: string) => Promise<boolean>;
  SESSION_MAX_AGE_MS: number;
};

const SECRET = "test-secret-must-be-stable";

function loadSession(): SessionModule {
  // 各テストで env を切り替えるため毎回 require cache を捨てる
  const resolved = requireFromOutput.resolve("../lib/session");
  delete require.cache[resolved];
  return requireFromOutput("../lib/session") as SessionModule;
}

test("verifySessionValue rejects when CLAPBOARD_SESSION_SECRET is unset", async () => {
  process.env.CLAPBOARD_SESSION_SECRET = SECRET;
  const issued = await loadSession().createSessionValue();

  delete process.env.CLAPBOARD_SESSION_SECRET;
  const ok = await loadSession().verifySessionValue(issued);
  assert.equal(ok, false);
});

test("verifySessionValue accepts a freshly issued cookie", async () => {
  process.env.CLAPBOARD_SESSION_SECRET = SECRET;
  const session = loadSession();
  const issued = await session.createSessionValue();
  assert.equal(await session.verifySessionValue(issued), true);
});

test("verifySessionValue rejects timestamps older than 7 days", async () => {
  process.env.CLAPBOARD_SESSION_SECRET = SECRET;
  const session = loadSession();
  const expiredAt = Date.now() - session.SESSION_MAX_AGE_MS - 60_000;
  const value = await forgeSessionValue(SECRET, expiredAt);
  assert.equal(await session.verifySessionValue(value), false);
});

test("verifySessionValue rejects future-dated timestamps beyond skew tolerance", async () => {
  process.env.CLAPBOARD_SESSION_SECRET = SECRET;
  const session = loadSession();
  const futureAt = Date.now() + 5 * 60_000; // 5 分先 (skew 1 分超)
  const value = await forgeSessionValue(SECRET, futureAt);
  assert.equal(await session.verifySessionValue(value), false);
});

test("verifySessionValue rejects malformed payloads", async () => {
  process.env.CLAPBOARD_SESSION_SECRET = SECRET;
  const session = loadSession();
  for (const garbage of [
    "",
    "no-dot",
    "abc.zzzz", // sig hex 不正
    "..",
    "0.deadbeef", // issuedAt <= 0
  ]) {
    assert.equal(
      await session.verifySessionValue(garbage),
      false,
      `expected reject for ${garbage}`,
    );
  }
});

test("verifySessionValue rejects payloads not in canonical base36 form", async () => {
  process.env.CLAPBOARD_SESSION_SECRET = SECRET;
  const session = loadSession();
  // 前ゼロ等で `parseInt` は通るが文字列再変換と一致しない値を弾く
  const value = await forgeSessionValue(SECRET, Date.now(), "0" + Date.now().toString(36));
  assert.equal(await session.verifySessionValue(value), false);
});

/** テスト用: 任意の発行時刻で署名済み Cookie 値を生成する */
async function forgeSessionValue(
  secret: string,
  issuedAtMs: number,
  payloadOverride?: string,
): Promise<string> {
  const encoder = new TextEncoder();
  const payload = payloadOverride ?? issuedAtMs.toString(36);
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${payload}.${sigHex}`;
}
