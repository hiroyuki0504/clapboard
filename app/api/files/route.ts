import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const CONFIGURED_ROOT = path.resolve(
  process.env.CLAPBOT_FILES_ROOT || path.join(os.homedir(), "Desktop"),
);

let realRootPromise: Promise<string> | null = null;
function getRealRoot() {
  if (!realRootPromise) {
    realRootPromise = fs.realpath(CONFIGURED_ROOT).catch(() => CONFIGURED_ROOT);
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

  const realRoot = await getRealRoot();

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
