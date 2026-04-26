"use client";

import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  buildFileTreeNodeId,
  fetchFileTreeDir,
  type FileTreeEntry,
  type FileTreeSource,
} from "@/lib/file-tree-api";
import { cn } from "@/lib/utils";

type DirState = {
  loading: boolean;
  error: string | null;
  items: FileTreeEntry[] | null;
};

type DirNodeProps = {
  entry: FileTreeEntry;
  source: FileTreeSource;
  depth: number;
  filter: string;
  forceOpen: boolean;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  cache: Record<string, DirState>;
  setCache: React.Dispatch<React.SetStateAction<Record<string, DirState>>>;
};

function FileLeaf({
  entry,
  depth,
}: {
  entry: FileTreeEntry;
  depth: number;
}) {
  return (
    <div
      role="treeitem"
      aria-level={depth + 1}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[#696158]"
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <FileText className="h-3.5 w-3.5 text-[#9a9084]" aria-hidden />
      <span className="truncate">{entry.name}</span>
    </div>
  );
}

function DirNode({
  entry,
  source,
  depth,
  filter,
  forceOpen,
  openMap,
  setOpenMap,
  cache,
  setCache,
}: DirNodeProps) {
  const open = forceOpen || !!openMap[entry.path];
  const dirState = cache[entry.path];
  const mountedRef = useRef(true);
  const childrenId = buildFileTreeNodeId(entry.path, source);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadChildren = useCallback(async () => {
    if (cache[entry.path]?.items || cache[entry.path]?.loading) return;
    setCache((c) => ({
      ...c,
      [entry.path]: { loading: true, error: null, items: null },
    }));
    try {
      const items = await fetchFileTreeDir(entry.path, source);
      if (!mountedRef.current) return;
      setCache((c) => ({
        ...c,
        [entry.path]: { loading: false, error: null, items },
      }));
    } catch (err) {
      if (!mountedRef.current) return;
      setCache((c) => ({
        ...c,
        [entry.path]: {
          loading: false,
          error: err instanceof Error ? err.message : "failed",
          items: null,
        },
      }));
    }
  }, [entry.path, source, cache, setCache]);

  useEffect(() => {
    if (entry.isDir && open) {
      loadChildren();
    }
  }, [entry.isDir, open, loadChildren]);

  const toggle = useCallback(async () => {
    setOpenMap((m) => ({ ...m, [entry.path]: !m[entry.path] }));
    if (!open) {
      loadChildren();
    }
  }, [open, entry.path, setOpenMap, loadChildren]);

  const matchesFilter =
    !filter || entry.name.toLowerCase().includes(filter.toLowerCase());

  if (!entry.isDir) {
    if (!matchesFilter) return null;
    return <FileLeaf entry={entry} depth={depth} />;
  }

  const visibleChildren =
    filter && dirState?.items
      ? dirState.items.filter((c) =>
          c.name.toLowerCase().includes(filter.toLowerCase()),
        )
      : dirState?.items;

  if (filter && !matchesFilter && visibleChildren?.length === 0) {
    return null;
  }

  const indentStyle = { paddingLeft: 22 + depth * 14 };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        role="treeitem"
        aria-expanded={open}
        aria-controls={childrenId}
        aria-level={depth + 1}
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
        <div id={childrenId} role="group">
          {dirState?.loading && (
            <p className="px-2 py-1 text-xs text-[#9a9084]" style={indentStyle}>
              読み込み中…
            </p>
          )}
          {dirState?.error && (
            <p className="px-2 py-1 text-xs text-[#b14a2c]" style={indentStyle}>
              {dirState.error}
            </p>
          )}
          {visibleChildren?.map((child) => (
            <DirNode
              key={child.path}
              entry={child}
              source={source}
              depth={depth + 1}
              filter={filter}
              forceOpen={!!filter}
              openMap={openMap}
              setOpenMap={setOpenMap}
              cache={cache}
              setCache={setCache}
            />
          ))}
          {!dirState?.loading && visibleChildren?.length === 0 && (
            <p className="px-2 py-1 text-xs text-[#9a9084]" style={indentStyle}>
              {filter ? "(該当なし)" : "(空)"}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function FileTree({
  filter = "",
  source = "desktop",
  onRootSummary,
}: {
  filter?: string;
  source?: FileTreeSource;
  onRootSummary?: (summary: { count: number; sizeBytes: number }) => void;
}) {
  const [root, setRoot] = useState<FileTreeEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [cache, setCache] = useState<Record<string, DirState>>({});

  useEffect(() => {
    let active = true;

    setRoot(null);
    setError(null);
    setOpenMap({});
    setCache({});

    fetchFileTreeDir("", source)
      .then((items) => {
        if (!active) return;
        setRoot(items);
        if (source === "repository") {
          setOpenMap(
            Object.fromEntries(
              items
                .filter((entry) => entry.isDir)
                .map((entry) => [entry.path, true]),
            ),
          );
        }
        if (onRootSummary) {
          onRootSummary({
            count: items.length,
            sizeBytes: items.reduce((sum, i) => sum + (i.size ?? 0), 0),
          });
        }
      })
      .catch((e: Error) => {
        if (active) {
          setError(e.message);
        }
      });

    return () => {
      active = false;
    };
  }, [onRootSummary, source]);

  const visibleRoot = useMemo(() => {
    if (!root) return null;
    if (!filter) return root;
    return root.filter((entry) =>
      entry.name.toLowerCase().includes(filter.toLowerCase()) || entry.isDir,
    );
  }, [root, filter]);

  if (error) {
    const message =
      error === "not found"
        ? "ファイル表示は未設定です。デモではレビュー管制を優先表示しています。"
        : error;
    return <p className="px-2 py-2 text-xs text-[#81786d]">{message}</p>;
  }
  if (!visibleRoot) {
    return <p className="px-2 py-2 text-xs text-[#9a9084]">読み込み中…</p>;
  }

  return (
    <div
      role="tree"
      aria-label={source === "repository" ? "Git tree" : "ファイルツリー"}
      className="space-y-0.5 text-sm text-[#5f574d]"
    >
      {visibleRoot.map((entry) => (
        <DirNode
          key={entry.path}
          entry={entry}
          source={source}
          depth={0}
          filter={filter}
          forceOpen={!!filter}
          openMap={openMap}
          setOpenMap={setOpenMap}
          cache={cache}
          setCache={setCache}
        />
      ))}
      {visibleRoot.length === 0 && (
        <p className="px-2 py-2 text-xs text-[#9a9084]">
          {filter ? "(該当なし)" : "(空)"}
        </p>
      )}
    </div>
  );
}
