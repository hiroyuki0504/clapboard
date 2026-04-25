import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

const CONFIGURED_ROOT_ENV = process.env.CLAPBOT_FILES_ROOT?.trim();
const ALLOW_DEFAULT_ROOT =
  process.env.CLAPBOT_ALLOW_DEFAULT_FILES_ROOT === "1";

function resolveConfiguredRoot(): string | null {
  if (CONFIGURED_ROOT_ENV) {
    return path.resolve(CONFIGURED_ROOT_ENV);
  }
  if (process.env.NODE_ENV === "production" && !ALLOW_DEFAULT_ROOT) {
    return null;
  }
  return path.resolve(process.cwd(), "files");
}

const CONFIGURED_ROOT = resolveConfiguredRoot();

let realRootPromise: Promise<string> | null = null;
function getRealRoot(): Promise<string> | null {
  if (!CONFIGURED_ROOT) return null;
  if (!realRootPromise) {
    const root = CONFIGURED_ROOT;
    realRootPromise = fs.realpath(root).catch(() => root);
  }
  return realRootPromise;
}

function isWithin(realRoot: string, candidate: string) {
  return candidate === realRoot || candidate.startsWith(realRoot + path.sep);
}

function resolveSafe(realRoot: string, rel: string) {
  const target = path.resolve(realRoot, rel);
  if (!isWithin(realRoot, target)) {
    throw new Error("path escapes root");
  }
  return target;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rel = url.searchParams.get("path") ?? "";

  const realRootMaybe = getRealRoot();
  if (!realRootMaybe) {
    return NextResponse.json(
      {
        error:
          "files root is not configured. Set CLAPBOT_FILES_ROOT to enable file listing.",
      },
      { status: 503 },
    );
  }
  const realRoot = await realRootMaybe;

  let target: string;
  try {
    target = resolveSafe(realRoot, rel);
  } catch {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  let realTarget: string;
  try {
    realTarget = await fs.realpath(target);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  if (!isWithin(realRoot, realTarget)) {
    return NextResponse.json({ error: "path escapes root" }, { status: 400 });
  }

  try {
    const entries = await fs.readdir(realTarget, { withFileTypes: true });
    const items = (
      await Promise.all(
        entries
          .filter((e) => !e.name.startsWith("."))
          .map(async (e) => {
            const full = path.join(realTarget, e.name);
            const lstat = await fs.lstat(full).catch(() => null);
            if (!lstat) return null;
            if (lstat.isSymbolicLink()) {
              const resolved = await fs.realpath(full).catch(() => null);
              if (!resolved || !isWithin(realRoot, resolved)) return null;
            }
            const stat = await fs.stat(full).catch(() => null);
            if (!stat) return null;
            return {
              name: e.name,
              path: path.relative(realRoot, full),
              isDir: stat.isDirectory(),
              size: stat.size,
              updatedAt: stat.mtime?.toISOString() ?? null,
            };
          }),
      )
    ).filter((item): item is NonNullable<typeof item> => item !== null);

    items.sort((a, b) =>
      a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1,
    );
    return NextResponse.json({ root: realRoot, path: rel, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
