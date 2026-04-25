"use client";

import {
  GitPullRequest,
  LayoutDashboard,
  Network,
  SquareTerminal,
  TableProperties,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const workspaceTabs = [
  {
    label: "ダッシュボード",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "グラフ",
    href: "/graph",
    icon: Network,
  },
  {
    label: "コマンド",
    href: "/command",
    icon: SquareTerminal,
  },
  {
    label: "タイムライン",
    href: "/timeline",
    icon: TimerReset,
  },
  {
    label: "案件一覧",
    href: "/projects",
    icon: TableProperties,
  },
  {
    label: "レビュー管制",
    href: "/code-review",
    icon: GitPullRequest,
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function WorkspaceTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="ワークスペース表示タブ"
      className="border-b border-[#d8d1c4] bg-[#f3f0e7]/94 px-3 py-2 sm:px-5"
    >
      <div className="thin-scrollbar flex gap-1 overflow-x-auto">
        {workspaceTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(pathname, tab.href);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-2 rounded-md border px-3 text-sm font-bold transition",
                active
                  ? "border-[#312d27] bg-[#312d27] text-white shadow-sm"
                  : "border-transparent text-[#70675b] hover:border-[#c8c0b4] hover:bg-[#fffefa] hover:text-[#312d27]",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
