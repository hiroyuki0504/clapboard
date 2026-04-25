"use client";

import { CalendarDays, Command, Plus, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildDateLabel, cn } from "@/lib/utils";

const titles = [
  { match: "/code-review", label: "Code Review Control", caption: "main保護・ブランチ分割・Codexレビュー管理" },
  { match: "/projects", label: "Progress Board", caption: "ワークストリームごとの進捗管理" },
  { match: "/", label: "Progress Dashboard", caption: "今日の進捗・ブロッカー・次アクションを確認" },
];

const mobileNav = [
  { label: "Progress", href: "/" },
  { label: "Board", href: "/projects" },
  { label: "Review", href: "/code-review" },
];

export function Topbar() {
  const pathname = usePathname();
  const dashboardTitle = titles.find((item) => item.match === "/") ?? titles[0];
  const title =
    pathname === "/"
      ? dashboardTitle
      : pathname.startsWith("/projects/")
        ? { label: "Progress Detail", caption: "進捗ワークスペース" }
        : titles.find((item) => item.match !== "/" && pathname.startsWith(item.match)) ?? dashboardTitle;
  const [dateLabel, setDateLabel] = useState<string | null>(null);

  useEffect(() => {
    setDateLabel(buildDateLabel(new Date()));
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-[#d2c8b8] bg-[#fbfaf5]/95 backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-3 py-3 sm:px-5">
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

        <div className="hidden flex-1 justify-end gap-3 lg:flex">
          <label className="flex h-10 w-full max-w-md items-center gap-2 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm text-[#8b8175]">
            <Search className="h-4 w-4" aria-hidden />
            <input
              className="w-full bg-transparent outline-none placeholder:text-[#9a9084]"
              placeholder="進捗・PR・ブランチ・ブロッカーを横断検索..."
            />
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#8b8175]">
              <Command className="h-3 w-3" aria-hidden />K
            </span>
          </label>
          <Button variant="secondary" className="h-10 rounded-md px-3">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            絞り込み
          </Button>
          <Button className="h-10 rounded-md px-3">
            <Plus className="h-4 w-4" aria-hidden />
            進捗追加
          </Button>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto px-3 pb-3 md:hidden">
        {mobileNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 py-2 text-sm font-semibold text-[#70675b]",
              pathname === item.href && "border-[#312d27] bg-[#312d27] text-white",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
