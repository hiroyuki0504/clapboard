"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FilePanel } from "./file-panel";
import { isNavItemActive, type NavItem, railItems } from "./nav-items";

type SidebarContentProps = {
  onNavigate?: () => void;
  agentSummary?: React.ReactNode;
};

export function SidebarContent({
  onNavigate,
  agentSummary,
}: SidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [filter, setFilter] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [rootSummary, setRootSummary] = useState<{
    count: number;
    sizeBytes: number;
  } | null>(null);
  const handleSummary = useCallback(
    (summary: { count: number; sizeBytes: number }) => setRootSummary(summary),
    [],
  );

  useEffect(() => {
    const syncHash = () => setCurrentHash(window.location.hash);

    syncHash();
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  const isActiveItem = useCallback(
    (item: NavItem) => isNavItemActive(item, pathname, currentHash),
    [currentHash, pathname],
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
          href="/code-review"
          onClick={onNavigate}
          className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-[#fffefa] text-[#221d38] shadow-[0_1px_0_rgba(0,0,0,0.22)]"
          aria-label="レビュー管制に戻る"
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
            const active = isActiveItem(item);

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
                <span className="block w-full text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <FilePanel
        agentSummary={agentSummary}
        filter={filter}
        onFilterChange={setFilter}
        onRootSummary={handleSummary}
        rootSummary={rootSummary}
        className="min-w-0 flex-1 overflow-y-auto border-r border-[#d2c8b8] bg-[#f1eee5]/94 px-3 py-4"
      />
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
