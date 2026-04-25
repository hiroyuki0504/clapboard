"use client";

import {
  Bot,
  Check,
  GitPullRequest,
  HelpCircle,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  Sparkles,
  SquareTerminal,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { FileTree } from "./file-tree";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

const railItems = [
  {
    label: "進捗",
    description: "全体の状況を確認",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "一覧",
    description: "ワークストリーム一覧",
    href: "/projects",
    icon: Network,
  },
  {
    label: "レビュー",
    description: "PRレビュー管制",
    href: "/code-review",
    icon: GitPullRequest,
  },
  {
    label: "タスク",
    description: "今日の次アクション",
    href: "/#todo",
    icon: Check,
  },
  {
    label: "Agent",
    description: "進捗エージェントログ",
    href: "/#agent",
    icon: Bot,
  },
  {
    label: "推移",
    description: "今週の進捗推移",
    href: "/#timeline",
    icon: TimerReset,
  },
  {
    label: "ガイド",
    description: "初めての方はこちら",
    href: "/#guide",
    icon: HelpCircle,
  },
];

export function Sidebar({ agentSummary }: { agentSummary?: React.ReactNode }) {
  const pathname = usePathname();
  const [filter, setFilter] = useState("");
  const [rootSummary, setRootSummary] = useState<{
    count: number;
    sizeBytes: number;
  } | null>(null);
  const handleSummary = useCallback(
    (summary: { count: number; sizeBytes: number }) => setRootSummary(summary),
    [],
  );

  return (
    <aside className="hidden shrink-0 md:flex">
      <div className="flex w-[68px] flex-col items-center border-r border-[#1d1831] bg-[#221d38] py-3">
        <Link
          href="/"
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#fffefa] text-[#221d38] shadow-[0_1px_0_rgba(0,0,0,0.22)]"
          aria-label="ClawBoard home"
        >
          <Sparkles className="h-5 w-5" aria-hidden />
        </Link>
        <nav className="flex flex-1 flex-col items-center gap-2">
          {railItems.map((item) => {
            const Icon = item.icon;
            const baseHref = item.href.split("#")[0];
            const active =
              item.href === "/"
                ? pathname === "/"
                : !item.href.includes("#") &&
                  (pathname === baseHref ||
                    pathname.startsWith(`${baseHref}/`));

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex w-12 flex-col items-center gap-1 rounded-lg border border-white/12 bg-white/7 px-1.5 py-2 text-center text-[10px] font-bold leading-tight text-[#d8d0c6] transition hover:bg-white/14 hover:text-white",
                  active &&
                    "border-[#d66b43] bg-[#cf623d] text-white hover:bg-[#cf623d]",
                )}
                aria-label={`${item.label} - ${item.description}`}
                title={`${item.label}\n${item.description}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="block w-full truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <Link
          href="/code-review"
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/7 text-[#d8d0c6] transition hover:bg-white/14 hover:text-white"
          aria-label="Command console"
          title="Command console"
        >
          <SquareTerminal className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="thin-scrollbar w-[260px] overflow-y-auto border-r border-[#d2c8b8] bg-[#f1eee5]/94 px-3 py-4">
        <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#71685d]">
          <span>Desktop Files</span>
          <Search className="h-3.5 w-3.5" aria-hidden />
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
            onChange={(e) => setFilter(e.target.value)}
            aria-label="ファイルを名前で絞り込み"
          />
        </label>

        <FileTree filter={filter} onRootSummary={handleSummary} />

        <div className="mt-5 space-y-3 border-t border-[#d8d0c4] pt-4 text-xs text-[#81786d]">
          <div className="flex items-center gap-2 rounded-lg border border-[#c8c0b4] bg-[#fffefa] p-3">
            <Bot className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
            <div>
              <p className="font-bold text-[#312d27]">Progress Agent</p>
              {agentSummary ?? <p className="mt-1 text-[#9a9084]">待機中</p>}
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-[#c8c0b4] bg-[#fffefa] p-3">
            <Sparkles className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
            <div>
              <p className="font-bold text-[#312d27]">デスクトップ概要</p>
              <p className="mt-1">
                {rootSummary
                  ? `${rootSummary.count}件 ・ 合計 ${formatSize(rootSummary.sizeBytes)}`
                  : "読み込み中..."}
              </p>
            </div>
          </div>
          <Link
            href="/code-review"
            className="flex items-center gap-2 px-2 py-2 text-[#70675b] transition hover:text-[#312d27]"
          >
            <Settings className="h-4 w-4" aria-hidden />
            レビュー設定
          </Link>
        </div>
      </div>
    </aside>
  );
}
