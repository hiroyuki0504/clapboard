"use client";

import {
  Bot,
  Check,
  Folder,
  Gamepad2,
  LayoutDashboard,
  Network,
  Search,
  Settings,
  Sparkles,
  SquareTerminal,
  JapaneseYen,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileTree } from "./file-tree";

const railItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "案件グラフ", href: "/projects", icon: Network },
  { label: "Files", href: "/projects", icon: Folder },
  { label: "ToDo", href: "/#todo", icon: Check },
  { label: "Agent", href: "/#agent", icon: Bot },
  { label: "Finance", href: "/#finance", icon: JapaneseYen },
  { label: "Sandbox", href: "/projects/ai-minutes", icon: Gamepad2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden shrink-0 md:flex">
      <div className="flex w-[58px] flex-col items-center border-r border-[#1d1831] bg-[#221d38] py-3">
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
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href.split("#")[0]);

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/7 text-[#d8d0c6] transition hover:bg-white/14 hover:text-white",
                  active &&
                    "border-[#d66b43] bg-[#cf623d] text-white hover:bg-[#cf623d]",
                )}
                aria-label={item.label}
                title={item.label}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </Link>
            );
          })}
        </nav>
        <Link
          href="#"
          className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/7 text-[#d8d0c6]"
          aria-label="Command console"
        >
          <SquareTerminal className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      <div className="thin-scrollbar w-[242px] overflow-y-auto border-r border-[#d2c8b8] bg-[#f1eee5]/94 px-3 py-4">
        <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[#71685d]">
          <span>Files</span>
          <div className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" aria-hidden />
            <span>+</span>
          </div>
        </div>
        <label className="mb-4 flex h-9 items-center gap-2 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm text-[#8b8175]">
          <Search className="h-3.5 w-3.5" aria-hidden />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9a9084]"
            placeholder="files / contents..."
          />
        </label>

        <FileTree />

        <div className="mt-5 border-t border-[#d8d0c4] pt-4 text-xs text-[#81786d]">
          <div className="flex items-center gap-2 rounded-lg border border-[#c8c0b4] bg-[#fffefa] p-3">
            <Bot className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
            <div>
              <p className="font-bold text-[#312d27]">OpenClaw Ready</p>
              <p className="mt-1">42 items ・ 1.2GB</p>
            </div>
          </div>
          <Link
            href="#"
            className="mt-3 flex items-center gap-2 px-2 py-2 text-[#70675b]"
          >
            <Settings className="h-4 w-4" aria-hidden />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
