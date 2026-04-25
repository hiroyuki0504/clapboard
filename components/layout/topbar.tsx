"use client";

import { CalendarDays } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileNav } from "@/components/layout/mobile-nav";
import { buildDateLabel } from "@/lib/utils";

const titles = [
  {
    match: "/graph",
    label: "関係グラフ",
    caption: "ワーク・タスク・ファイルのつながりを確認",
  },
  {
    match: "/command",
    label: "コマンドセンター",
    caption: "AIへの指示と実行ログを追跡",
  },
  {
    match: "/timeline",
    label: "タイムライン",
    caption: "予定と進捗を時間軸で確認",
  },
  {
    match: "/code-review",
    label: "レビュー管制",
    caption: "PRとレビュー状態を管理",
  },
  {
    match: "/projects",
    label: "案件一覧",
    caption: "すべての案件と進捗を一覧",
  },
  {
    match: "/",
    label: "ダッシュボード",
    caption: "今日の状況をひと目で把握",
  },
];

export function Topbar({ agentSummary }: { agentSummary?: React.ReactNode }) {
  const pathname = usePathname();
  const dashboardTitle = titles.find((item) => item.match === "/") ?? titles[0];
  const title =
    pathname === "/"
      ? dashboardTitle
      : pathname.startsWith("/projects/")
        ? { label: "案件の詳細", caption: "選択した案件の中身を確認" }
        : (titles.find(
            (item) => item.match !== "/" && pathname.startsWith(item.match),
          ) ?? dashboardTitle);
  const [dateLabel, setDateLabel] = useState<string | null>(null);

  useEffect(() => {
    setDateLabel(buildDateLabel(new Date()));
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-[#d2c8b8] bg-[#fbfaf5]/95 backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-between gap-3 px-3 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <MobileNav agentSummary={agentSummary} />
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b8175]">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              <span suppressHydrationWarning>{dateLabel ?? ""}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <h1 className="truncate text-xl font-black tracking-normal text-[#2f2b25]">
                {title.label}
              </h1>
              <span className="hidden text-sm text-[#81786d] sm:inline">
                {title.caption}
              </span>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
