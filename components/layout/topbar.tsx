"use client";

import { CalendarDays, HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const titles = [
  {
    match: "/",
    label: "ダッシュボード",
    caption: "今日の状況をひと目で把握",
  },
  {
    match: "/projects",
    label: "案件一覧",
    caption: "すべての案件と進捗を一覧",
  },
];

const mobileNav = [
  { label: "ダッシュボード", href: "/" },
  { label: "案件一覧", href: "/projects" },
];

const today = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
}).format(new Date());

export function Topbar() {
  const pathname = usePathname();
  const title =
    pathname === "/"
      ? titles[0]
      : pathname.startsWith("/projects/")
        ? { label: "案件の詳細", caption: "選択した案件の中身を編集・確認" }
        : (titles.find((item) => pathname.startsWith(item.match)) ?? titles[0]);

  return (
    <header className="sticky top-0 z-20 border-b border-[#d2c8b8] bg-[#fbfaf5]/95 backdrop-blur">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-3 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#8b8175]">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden />
            {today}
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

        <Link
          href="/#guide"
          className="hidden h-10 items-center gap-2 rounded-md border border-[#bfb6a8] bg-[#fffefa] px-3 text-sm font-semibold text-[#312d27] transition hover:bg-[#f6f1e7] lg:inline-flex"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
          使い方ガイド
        </Link>
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
