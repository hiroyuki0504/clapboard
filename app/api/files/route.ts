import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const ROOT = path.resolve(
  process.env.CLAPBOT_FILES_ROOT || path.join(os.homedir(), "Desktop"),
);

function resolveSafe(rel: string) {
  const target = path.resolve(ROOT, rel);
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) {
    throw new Error("path escapes root");
  }
  return target;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rel = url.searchParams.get("path") ?? "";

  let target: string;
  try {
    target = resolveSafe(rel);
  } catch {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  try {
    const entries = await fs.readdir(target, { withFileTypes: true });
    const items = await Promise.all(
      entries
        .filter((e) => !e.name.startsWith("."))
        .map(async (e) => {
          const full = path.join(target, e.name);
          const stat = await fs.stat(full).catch(() => null);
          return {
            name: e.name,
            path: path.relative(ROOT, full),
            isDir: e.isDirectory(),
            size: stat?.size ?? 0,
            updatedAt: stat?.mtime?.toISOString() ?? null,
          };
        }),
    );
    items.sort((a, b) =>
      a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1,
    );
    return NextResponse.json({ root: ROOT, path: rel, items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
