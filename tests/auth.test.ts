import assert from "node:assert/strict";
import test from "node:test";
import {
  hasAnyConfiguredCredential,
  resolveRoleFromSecret,
  sanitizeRedirectPath,
} from "../lib/auth";

function withAuthEnv<T>(env: Record<string, string | undefined>, run: () => T) {
  const previous = {
    CLAPBOARD_ACCESS_TOKEN: process.env.CLAPBOARD_ACCESS_TOKEN,
    CLAPBOARD_PASSWORD: process.env.CLAPBOARD_PASSWORD,
    CLAPBOARD_VIEWER_TOKEN: process.env.CLAPBOARD_VIEWER_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

test("development accepts passwor as the default admin secret", () => {
  withAuthEnv(
    {
      CLAPBOARD_ACCESS_TOKEN: undefined,
      CLAPBOARD_PASSWORD: undefined,
      CLAPBOARD_VIEWER_TOKEN: undefined,
      NODE_ENV: "development",
    },
    () => {
      assert.equal(hasAnyConfiguredCredential(), true);
      assert.equal(resolveRoleFromSecret("passwor"), "admin");
    },
  );
});

test("production requires an explicit configured secret", () => {
  withAuthEnv(
    {
      CLAPBOARD_ACCESS_TOKEN: undefined,
      CLAPBOARD_PASSWORD: undefined,
      CLAPBOARD_VIEWER_TOKEN: undefined,
      NODE_ENV: "production",
    },
    () => {
      assert.equal(hasAnyConfiguredCredential(), false);
      assert.equal(resolveRoleFromSecret("password"), null);
    },
  );
});

test("configured password can be short for demo environments", () => {
  withAuthEnv(
    {
      CLAPBOARD_ACCESS_TOKEN: undefined,
      CLAPBOARD_PASSWORD: "password",
      CLAPBOARD_VIEWER_TOKEN: "viewer-secret",
      NODE_ENV: "production",
    },
    () => {
      assert.equal(resolveRoleFromSecret("password"), "admin");
      assert.equal(resolveRoleFromSecret("viewer-secret"), "viewer");
    },
  );
});

test("redirect paths stay internal", () => {
  assert.equal(sanitizeRedirectPath("/projects?id=1"), "/projects?id=1");
  assert.equal(sanitizeRedirectPath("https://example.com"), "/");
  assert.equal(sanitizeRedirectPath("//example.com"), "/");
});
