"use client";

import { Bot, GitBranch, Monitor, Search, Sparkles } from "lucide-react";
import type { FileTreeSource } from "@/lib/file-tree-api";
import { cn, formatByteSize } from "@/lib/utils";
import { FileTree } from "./file-tree";

const fileSources: Array<{
  source: FileTreeSource;
  tabLabel: string;
  heading: string;
  description: string;
  summaryLabel: string;
  icon: React.ElementType;
}> = [
  {
    source: "desktop",
    tabLabel: "Desktop",
    heading: "デスクトップのファイル",
    description:
      "このパソコンの ~/Desktop の中身です。フォルダをクリックすると中身が見えます。",
    summaryLabel: "デスクトップ概要",
    icon: Monitor,
  },
  {
    source: "repository",
    tabLabel: "Git tree",
    heading: "今回のリポジトリ",
    description:
      "ハッカソンで使っている clapboard リポジトリの内容です。生成物と隠しファイルは除外しています。",
    summaryLabel: "リポジトリ概要",
    icon: GitBranch,
  },
];

export function FilePanel({
  agentSummary,
  className,
  source,
  onSourceChange,
  filter,
  onFilterChange,
  onRootSummary,
  rootSummary,
}: {
  agentSummary?: React.ReactNode;
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

  return (
    <div className={cn("thin-scrollbar", className)}>
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#71685d]">
        <span>{activeMeta.heading}</span>
      </div>
      <div
        className="mb-3 grid grid-cols-2 gap-1 rounded-md border border-[#c8c0b4] bg-[#e8e1d3] p-1"
        role="group"
        aria-label="ファイルツリーの表示切り替え"
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
      <label className="mb-3 flex h-9 items-center gap-2 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm text-[#8b8175]">
        <Search className="h-3.5 w-3.5" aria-hidden />
        <input
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9a9084]"
          placeholder="名前で絞り込み..."
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          aria-label="ファイルを名前で絞り込み"
        />
      </label>

      <FileTree
        source={source}
        filter={filter}
        onRootSummary={onRootSummary}
      />

      <div className="mt-5 space-y-3 border-t border-[#d8d0c4] pt-4 text-xs text-[#81786d]">
        {agentSummary && (
          <div className="flex items-center gap-2 rounded-lg border border-[#c8c0b4] bg-[#fffefa] p-3">
            <Bot className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
            <div className="min-w-0">
              <p className="font-bold text-[#312d27]">エージェント</p>
              {agentSummary}
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-[#c8c0b4] bg-[#fffefa] p-3">
          <Sparkles className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
          <div>
            <p className="font-bold text-[#312d27]">
              {activeMeta.summaryLabel}
            </p>
            <p className="mt-1">
              {rootSummary
                ? `${rootSummary.count}件 ・ 合計 ${formatByteSize(rootSummary.sizeBytes)}`
                : "読み込み中..."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
