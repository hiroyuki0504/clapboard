import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

type FileSource = "desktop" | "repository";

const CONFIGURED_ROOT_ENV = process.env.CLAPBOT_FILES_ROOT?.trim();
const ALLOW_DEFAULT_ROOT =
  process.env.CLAPBOT_ALLOW_DEFAULT_FILES_ROOT === "1";
const CONFIGURED_REPOSITORY_ROOT_ENV =
  process.env.CLAPBOARD_REPOSITORY_ROOT?.trim();
const REPOSITORY_IGNORED_NAMES = new Set([
  "node_modules",
  ".next",
  "out",
  "dist",
  "build",
  "coverage",
]);

function isFileSource(value: string): value is FileSource {
  return value === "desktop" || value === "repository";
}

function resolveConfiguredRoot(source: FileSource): string | null {
  if (source === "repository") {
    return path.resolve(CONFIGURED_REPOSITORY_ROOT_ENV || process.cwd());
  }
  if (CONFIGURED_ROOT_ENV) {
    return path.resolve(CONFIGURED_ROOT_ENV);
  }
  if (process.env.NODE_ENV === "production" && !ALLOW_DEFAULT_ROOT) {
    return null;
  }
  return path.resolve(process.cwd(), "files");
}

const realRootPromises: Partial<Record<FileSource, Promise<string>>> = {};
function getRealRoot(source: FileSource): Promise<string> | null {
  const CONFIGURED_ROOT = resolveConfiguredRoot(source);
  if (!CONFIGURED_ROOT) return null;
  if (!realRootPromises[source]) {
    const root = CONFIGURED_ROOT;
    realRootPromises[source] = fs.realpath(root).catch(() => root);
  }
  return realRootPromises[source] ?? null;
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

function shouldSkipEntry(source: FileSource, name: string) {
  if (name.startsWith(".")) return true;
  return source === "repository" && REPOSITORY_IGNORED_NAMES.has(name);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rel = url.searchParams.get("path") ?? "";
  const sourceParam = url.searchParams.get("source") ?? "desktop";

  if (!isFileSource(sourceParam)) {
    return NextResponse.json({ error: "invalid source" }, { status: 400 });
  }

  const realRootMaybe = getRealRoot(sourceParam);
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
          .filter((e) => !shouldSkipEntry(sourceParam, e.name))
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
    return NextResponse.json({
      root: realRoot,
      path: rel,
      source: sourceParam,
      items,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "read failed";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
