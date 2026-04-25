"use client";

import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Entry = {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  updatedAt: string | null;
};

type DirState = {
  loading: boolean;
  error: string | null;
  items: Entry[] | null;
};

async function fetchDir(rel: string): Promise<Entry[]> {
  const res = await fetch(`/api/files?path=${encodeURIComponent(rel)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }
  const data = (await res.json()) as { items: Entry[] };
  return data.items;
}

function DirNode({
  entry,
  depth,
  openMap,
  setOpenMap,
  cache,
  setCache,
}: {
  entry: Entry;
  depth: number;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  cache: Record<string, DirState>;
  setCache: React.Dispatch<React.SetStateAction<Record<string, DirState>>>;
}) {
  const open = !!openMap[entry.path];
  const dirState = cache[entry.path];

  const toggle = useCallback(async () => {
    setOpenMap((m) => ({ ...m, [entry.path]: !m[entry.path] }));
    if (!open && !cache[entry.path]?.items) {
      setCache((c) => ({
        ...c,
        [entry.path]: { loading: true, error: null, items: null },
      }));
      try {
        const items = await fetchDir(entry.path);
        setCache((c) => ({
          ...c,
          [entry.path]: { loading: false, error: null, items },
        }));
      } catch (err) {
        setCache((c) => ({
          ...c,
          [entry.path]: {
            loading: false,
            error: err instanceof Error ? err.message : "failed",
            items: null,
          },
        }));
      }
    }
  }, [open, entry.path, cache, setCache, setOpenMap]);

  if (!entry.isDir) {
    return (
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[#696158]"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <FileText className="h-3.5 w-3.5 text-[#9a9084]" aria-hidden />
        <span className="truncate">{entry.name}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left transition hover:bg-[#e5dfd2]"
        style={{ paddingLeft: 4 + depth * 14 }}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-[#a39888] transition-transform",
            open && "rotate-90",
          )}
          aria-hidden
        />
        {open ? (
          <FolderOpen className="h-4 w-4 text-[#8b8175]" aria-hidden />
        ) : (
          <Folder className="h-4 w-4 text-[#8b8175]" aria-hidden />
        )}
        <span className="truncate">{entry.name}</span>
      </button>
      {open && (
        <div>
          {dirState?.loading && (
            <p
              className="px-2 py-1 text-xs text-[#9a9084]"
              style={{ paddingLeft: 22 + depth * 14 }}
            >
              読み込み中…
            </p>
          )}
          {dirState?.error && (
            <p
              className="px-2 py-1 text-xs text-[#b14a2c]"
              style={{ paddingLeft: 22 + depth * 14 }}
            >
              {dirState.error}
            </p>
          )}
          {dirState?.items?.map((child) => (
            <DirNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              openMap={openMap}
              setOpenMap={setOpenMap}
              cache={cache}
              setCache={setCache}
            />
          ))}
          {dirState?.items?.length === 0 && (
            <p
              className="px-2 py-1 text-xs text-[#9a9084]"
              style={{ paddingLeft: 22 + depth * 14 }}
            >
              (空)
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function FileTree() {
  const [root, setRoot] = useState<Entry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [cache, setCache] = useState<Record<string, DirState>>({});

  useEffect(() => {
    fetchDir("")
      .then((items) => setRoot(items))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <p className="px-2 py-2 text-xs text-[#b14a2c]">{error}</p>;
  }
  if (!root) {
    return <p className="px-2 py-2 text-xs text-[#9a9084]">読み込み中…</p>;
  }

  return (
    <div className="space-y-0.5 text-sm text-[#5f574d]">
      {root.map((entry) => (
        <DirNode
          key={entry.path}
          entry={entry}
          depth={0}
          openMap={openMap}
          setOpenMap={setOpenMap}
          cache={cache}
          setCache={setCache}
        />
      ))}
      {root.length === 0 && (
        <p className="px-2 py-2 text-xs text-[#9a9084]">(空)</p>
      )}
    </div>
  );
}
