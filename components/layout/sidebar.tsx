"use client";

import {
  Bot,
  Check,
  Folder,
  HelpCircle,
  LayoutDashboard,
  JapaneseYen,
  Network,
  Search,
  SquareTerminal,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { FileTree } from "./file-tree";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

export const railItems = [
  {
    label: "ダッシュボード",
    shortLabel: "ホーム",
    description: "全体の状況を確認",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "案件一覧",
    shortLabel: "案件",
    description: "すべての案件",
    href: "/projects",
    icon: Folder,
  },
  {
    label: "グラフ",
    shortLabel: "グラフ",
    description: "関係性を可視化",
    href: "/graph",
    icon: Network,
  },
  {
    label: "コマンド",
    shortLabel: "コマンド",
    description: "AI実行ログと指示",
    href: "/command",
    icon: SquareTerminal,
  },
  {
    label: "タイムライン",
    shortLabel: "タイム",
    description: "予定と実行履歴",
    href: "/timeline",
    icon: TimerReset,
  },
  {
    label: "今日のタスク",
    shortLabel: "今日",
    description: "未処理タスク",
    href: "/#todo",
    icon: Check,
  },
  {
    label: "今月の収支",
    shortLabel: "収支",
    description: "売上と支出",
    href: "/#finance",
    icon: JapaneseYen,
  },
  {
    label: "使い方ガイド",
    shortLabel: "ガイド",
    description: "初めての方はこちら",
    href: "/#guide",
    icon: HelpCircle,
  },
];

export function SidebarContent({
  onNavigate,
  agentSummary,
}: {
  onNavigate?: () => void;
  agentSummary?: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [rootSummary, setRootSummary] = useState<{
    count: number;
    sizeBytes: number;
  } | null>(null);
  const handleSummary = useCallback(
    (summary: { count: number; sizeBytes: number }) => setRootSummary(summary),
    [],
  );

  const handleNavClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      onNavigate?.();
      if (!href.includes("#")) return;
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0
      ) {
        return;
      }
      event.preventDefault();
      const [base, hash] = href.split("#");
      const targetPath = base === "" ? "/" : base;
      const scrollToHash = () => {
        const target = document.getElementById(hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      if (pathname === targetPath) {
        const nextUrl = `${window.location.pathname}${window.location.search}#${hash}`;
        window.history.pushState(null, "", nextUrl);
        window.dispatchEvent(new HashChangeEvent("hashchange"));
        scrollToHash();
        return;
      }
      router.push(href, { scroll: false });
      requestAnimationFrame(scrollToHash);
    },
    [onNavigate, pathname, router],
  );

  return (
    <div className="flex h-full w-full">
      <div className="flex w-[92px] shrink-0 flex-col items-center border-r border-[#1d1831] bg-[#221d38] py-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#fffefa] text-[#221d38] shadow-[0_1px_0_rgba(0,0,0,0.22)]"
          aria-label="ホームに戻る"
        >
          <img
            src="/icon.png"
            alt=""
            className="h-8 w-8 rounded-md object-cover"
            aria-hidden
          />
        </Link>
        <nav className="thin-scrollbar flex flex-1 flex-col items-center gap-2 overflow-y-auto">
          {railItems.map((item) => {
            const Icon = item.icon;
            const baseHref = item.href.split("#")[0];
            const active =
              item.href === "/"
                ? pathname === "/"
                : !item.href.includes("#") &&
                  baseHref !== "" &&
                  (pathname === baseHref || pathname.startsWith(`${baseHref}/`));

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                scroll={false}
                onClick={(event) => handleNavClick(event, item.href)}
                className={cn(
                  "flex w-[76px] flex-col items-center justify-center gap-1 rounded-lg border border-white/12 bg-white/7 px-2 py-2 text-[11px] font-bold leading-tight text-[#d8d0c6] transition hover:bg-white/14 hover:text-white",
                  active &&
                    "border-[#d66b43] bg-[#cf623d] text-white hover:bg-[#cf623d]",
                )}
                aria-label={`${item.label} — ${item.description}`}
                title={`${item.label}\n${item.description}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="block w-full text-center leading-tight">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="thin-scrollbar min-w-0 flex-1 overflow-y-auto border-r border-[#d2c8b8] bg-[#f1eee5]/94 px-3 py-4">
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
            onChange={(e) => setFilter(e.target.value)}
            aria-label="ファイルを名前で絞り込み"
          />
        </label>

        <FileTree filter={filter} onRootSummary={handleSummary} />

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
            <img
              src="/icon.png"
              alt=""
              className="h-4 w-4 rounded-sm object-cover"
              aria-hidden
            />
            <div>
              <p className="font-bold text-[#312d27]">デスクトップ概要</p>
              <p className="mt-1">
                {rootSummary
                  ? `${rootSummary.count}件 ・ 合計 ${formatSize(rootSummary.sizeBytes)}`
                  : "読み込み中..."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({ agentSummary }: { agentSummary?: React.ReactNode }) {
  return (
    <aside className="hidden h-full w-[328px] shrink-0 md:flex">
      <SidebarContent agentSummary={agentSummary} />
    </aside>
  );
}
