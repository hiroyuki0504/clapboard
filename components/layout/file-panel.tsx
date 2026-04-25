"use client";

import { Bot, Search, Sparkles } from "lucide-react";
import { cn, formatByteSize } from "@/lib/utils";
import { FileTree } from "./file-tree";

export function FilePanel({
  agentSummary,
  className,
  filter,
  onFilterChange,
  onRootSummary,
  rootSummary,
}: {
  agentSummary?: React.ReactNode;
  className?: string;
  filter: string;
  onFilterChange: (value: string) => void;
  onRootSummary: (summary: { count: number; sizeBytes: number }) => void;
  rootSummary: { count: number; sizeBytes: number } | null;
}) {
  return (
    <div className={cn("thin-scrollbar", className)}>
      <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#71685d]">
        <span>デスクトップのファイル</span>
      </div>
      <p className="mb-3 text-[11px] leading-5 text-[#81786d]">
        このパソコンの ~/Desktop の中身です。フォルダをクリックすると中身が見えます。
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

      <FileTree filter={filter} onRootSummary={onRootSummary} />

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
            <p className="font-bold text-[#312d27]">デスクトップ概要</p>
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
