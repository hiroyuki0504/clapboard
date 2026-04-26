"use client";

import {
  GitBranch,
  Monitor,
  Plus,
  Search,
} from "lucide-react";
import { useCallback, useState } from "react";
import type { FileTreeSource } from "@/lib/file-tree-api";
import { cn, formatByteSize } from "@/lib/utils";
import { FileTree } from "./file-tree";
import { GitBranchTree } from "./git-branch-tree";

type GitTreeSummary = {
  branchCount: number;
  commitCount: number;
};

const fileSources: Array<{
  source: FileTreeSource;
  tabLabel: string;
  heading: string;
  description: string;
  icon: React.ElementType;
}> = [
  {
    source: "desktop",
    tabLabel: "Desktop",
    heading: "デスクトップのファイル",
    description:
      "このパソコンの ~/Desktop の中身です。フォルダをクリックすると中身が見えます。",
    icon: Monitor,
  },
  {
    source: "repository",
    tabLabel: "Git tree",
    heading: "今回のリポジトリ",
    description:
      "このリポジトリの実ブランチを使ったGitツリーです。mainを幹にして、現在の作業ブランチと分岐を表示します。",
    icon: GitBranch,
  },
];

export function FilePanel({
  className,
  source,
  onSourceChange,
  filter,
  onFilterChange,
  onRootSummary,
  rootSummary,
}: {
  className?: string;
  source: FileTreeSource;
  onSourceChange: (source: FileTreeSource) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  onRootSummary: (summary: { count: number; sizeBytes: number }) => void;
  rootSummary: { count: number; sizeBytes: number } | null;
}) {
  const activeMeta =
    fileSources.find((item) => item.source === source) ?? fileSources[0];
  const [gitSummary, setGitSummary] = useState<GitTreeSummary | null>(null);
  const handleGitSummary = useCallback((summary: GitTreeSummary) => {
    setGitSummary(summary);
  }, []);

  return (
    <div className={cn("thin-scrollbar", className)}>
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#71685d]">
        <span>{activeMeta.heading}</span>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-[#81786d] transition hover:bg-[#e8e1d3] hover:text-[#312d27]"
          aria-label={source === "repository" ? "ブランチを追加" : "ファイルを追加"}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
      <div
        className="mb-3 grid grid-cols-2 gap-1 rounded-md border border-[#c8c0b4] bg-[#e8e1d3] p-1"
        role="group"
        aria-label="ファイル表示の切り替え"
      >
        {fileSources.map((item) => {
          const Icon = item.icon;
          const active = item.source === source;
          return (
            <button
              key={item.source}
              type="button"
              onClick={() => onSourceChange(item.source)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-8 items-center justify-center gap-1.5 rounded px-2 text-xs font-black text-[#70675b] transition hover:bg-[#fffefa]",
                active && "bg-[#fffefa] text-[#312d27] shadow-sm",
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">{item.tabLabel}</span>
            </button>
          );
        })}
      </div>
      <p className="mb-3 text-[11px] leading-5 text-[#81786d]">
        {activeMeta.description}
      </p>
      <label className="mb-4 flex h-9 items-center gap-2 rounded border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm text-[#8b8175] shadow-[0_1px_0_rgba(49,45,39,0.04)]">
        <Search className="h-3.5 w-3.5" aria-hidden />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9a9084]"
          placeholder={
            source === "repository"
              ? "ブランチ名で絞り込み..."
              : "Desktopを名前で絞り込み..."
          }
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          aria-label={
            source === "repository"
              ? "ブランチを名前で絞り込み"
              : "ファイルを名前で絞り込み"
          }
        />
      </label>

      {source === "repository" ? (
        <GitBranchTree filter={filter} onSummary={handleGitSummary} />
      ) : (
        <FileTree
          source={source}
          filter={filter}
          onRootSummary={onRootSummary}
        />
      )}

      <div className="mt-4 flex items-center gap-2 px-2 text-xs text-[#81786d]">
        {source === "repository" && gitSummary ? (
          <>
            <span>{gitSummary.branchCount} branches</span>
            <span aria-hidden>・</span>
            <span>{gitSummary.commitCount} commits</span>
          </>
        ) : source === "repository" ? (
          <>
            <span>読み込み中...</span>
          </>
        ) : rootSummary ? (
          <>
            <span>{rootSummary.count} items</span>
            <span aria-hidden>・</span>
            <span>{formatByteSize(rootSummary.sizeBytes)}</span>
          </>
        ) : (
          <span>読み込み中...</span>
        )}
      </div>
    </div>
  );
}
