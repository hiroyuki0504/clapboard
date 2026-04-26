"use client";

import {
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type WorkspaceFileNode = {
  name: string;
  path: string;
  kind: "folder" | "file";
  defaultOpen?: boolean;
  children?: WorkspaceFileNode[];
};

const ACTIVE_FILE_PATH = "01_案件・リサーチ/案件サマリ_0423.md";

const workspaceFiles: WorkspaceFileNode[] = [
  {
    name: "01_案件・リサーチ",
    path: "01_案件・リサーチ",
    kind: "folder",
    defaultOpen: true,
    children: [
      {
        name: "クラウドワークス_抽出",
        path: "01_案件・リサーチ/クラウドワークス_抽出",
        kind: "folder",
      },
      {
        name: "Lancers_抽出",
        path: "01_案件・リサーチ/Lancers_抽出",
        kind: "folder",
      },
      {
        name: "案件サマリ_0423.md",
        path: ACTIVE_FILE_PATH,
        kind: "file",
      },
    ],
  },
  {
    name: "02_ナレッジ",
    path: "02_ナレッジ",
    kind: "folder",
    defaultOpen: true,
    children: [
      {
        name: "議事録_音声起こし",
        path: "02_ナレッジ/議事録_音声起こし",
        kind: "folder",
      },
      {
        name: "product_spec.pdf",
        path: "02_ナレッジ/product_spec.pdf",
        kind: "file",
      },
      {
        name: "競合比較.xlsx",
        path: "02_ナレッジ/競合比較.xlsx",
        kind: "file",
      },
    ],
  },
  {
    name: "03_収支・日報",
    path: "03_収支・日報",
    kind: "folder",
  },
  {
    name: "04_開発",
    path: "04_開発",
    kind: "folder",
  },
  {
    name: "05_共有_大容量",
    path: "05_共有_大容量",
    kind: "folder",
  },
  {
    name: "99_archive",
    path: "99_archive",
    kind: "folder",
  },
];

function buildInitialOpenMap(nodes: WorkspaceFileNode[]) {
  const map: Record<string, boolean> = {};
  const visit = (node: WorkspaceFileNode) => {
    if (node.kind === "folder" && node.defaultOpen) {
      map[node.path] = true;
    }
    node.children?.forEach(visit);
  };
  nodes.forEach(visit);
  return map;
}

function filterWorkspaceFiles(
  nodes: WorkspaceFileNode[],
  normalizedFilter: string,
): WorkspaceFileNode[] {
  if (!normalizedFilter) return nodes;

  return nodes.flatMap((node) => {
    const ownMatch = node.name.toLowerCase().includes(normalizedFilter);
    const children = node.children
      ? filterWorkspaceFiles(node.children, normalizedFilter)
      : [];

    if (node.kind === "folder" && (ownMatch || children.length > 0)) {
      return [{ ...node, children: ownMatch ? node.children : children }];
    }
    if (node.kind === "file" && ownMatch) {
      return [node];
    }
    return [];
  });
}

function WorkspaceFileTree({
  filter,
}: {
  filter: string;
}) {
  const [openMap, setOpenMap] = useState(() =>
    buildInitialOpenMap(workspaceFiles),
  );
  const normalizedFilter = filter.trim().toLowerCase();
  const visibleFiles = useMemo(
    () => filterWorkspaceFiles(workspaceFiles, normalizedFilter),
    [normalizedFilter],
  );

  if (visibleFiles.length === 0) {
    return (
      <p className="px-2 py-2 text-xs text-[#9a9084]">
        該当するファイルがありません。
      </p>
    );
  }

  return (
    <div
      role="tree"
      aria-label="ワークスペースファイル"
      className="space-y-1 text-sm text-[#5f574d]"
    >
      {visibleFiles.map((node) => (
        <WorkspaceFileTreeNode
          key={node.path}
          node={node}
          depth={0}
          forceOpen={Boolean(normalizedFilter)}
          openMap={openMap}
          setOpenMap={setOpenMap}
        />
      ))}
    </div>
  );
}

function WorkspaceFileTreeNode({
  node,
  depth,
  forceOpen,
  openMap,
  setOpenMap,
}: {
  node: WorkspaceFileNode;
  depth: number;
  forceOpen: boolean;
  openMap: Record<string, boolean>;
  setOpenMap: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const open = forceOpen || Boolean(openMap[node.path]);
  const active = node.path === ACTIVE_FILE_PATH;
  const paddingLeft = 6 + depth * 16;

  if (node.kind === "file") {
    return (
      <div
        role="treeitem"
        aria-level={depth + 1}
        aria-selected={active}
        className={cn(
          "flex h-8 items-center gap-2 rounded px-2 text-[#6c6359]",
          active && "bg-[#f3d2c7] font-bold text-[#9f452c]",
        )}
        style={{ paddingLeft }}
      >
        <FileText className="h-3.5 w-3.5 shrink-0 text-current" aria-hidden />
        <span className="min-w-0 truncate">{node.name}</span>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          setOpenMap((current) => ({
            ...current,
            [node.path]: !open,
          }))
        }
        role="treeitem"
        aria-level={depth + 1}
        aria-expanded={open}
        className="flex h-8 w-full items-center gap-1.5 rounded px-2 text-left text-[#6c6359] transition hover:bg-[#e8e1d3]"
        style={{ paddingLeft }}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-[#9a9084] transition-transform",
            open && "rotate-90",
          )}
          aria-hidden
        />
        {open ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-[#8b8175]" aria-hidden />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-[#8b8175]" aria-hidden />
        )}
        <span className="min-w-0 truncate font-medium">{node.name}</span>
      </button>
      {open && node.children && (
        <div role="group" className="space-y-1">
          {node.children.map((child) => (
            <WorkspaceFileTreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              forceOpen={forceOpen}
              openMap={openMap}
              setOpenMap={setOpenMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FilePanel({
  className,
  filter,
  onFilterChange,
}: {
  className?: string;
  filter: string;
  onFilterChange: (value: string) => void;
}) {
  return (
    <div className={cn("thin-scrollbar", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#71685d]">
          FILES
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-[#81786d] transition hover:bg-[#e8e1d3] hover:text-[#312d27]"
            aria-label="ファイルを検索"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-[#81786d] transition hover:bg-[#e8e1d3] hover:text-[#312d27]"
            aria-label="ファイルを追加"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
      <label className="mb-4 flex h-9 items-center gap-2 rounded border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm text-[#8b8175] shadow-[0_1px_0_rgba(49,45,39,0.04)]">
        <Search className="h-3.5 w-3.5" aria-hidden />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9a9084]"
          placeholder="files / contents..."
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          aria-label="ファイルとコンテンツを検索"
        />
      </label>

      <WorkspaceFileTree filter={filter} />

      <div className="mt-4 flex items-center gap-2 px-2 text-xs text-[#81786d]">
        <span>42 items</span>
        <span aria-hidden>・</span>
        <span>1.2GB</span>
      </div>
    </div>
  );
}
