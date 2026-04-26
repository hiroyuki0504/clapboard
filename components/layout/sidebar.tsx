"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { FileTreeSource } from "@/lib/file-tree-api";
import { cn } from "@/lib/utils";
import { FilePanel } from "./file-panel";
import { isNavItemActive, type NavItem, railItems } from "./nav-items";

type SidebarContentProps = {
  onNavigate?: () => void;
};

type RootSummary = {
  count: number;
  sizeBytes: number;
};

export function SidebarContent({
  onNavigate,
}: SidebarContentProps) {
  const pathname = usePathname();
  const [fileTreeSource, setFileTreeSource] =
    useState<FileTreeSource>("repository");
  const [filter, setFilter] = useState("");
  const [currentHash, setCurrentHash] = useState("");
  const [rootSummaries, setRootSummaries] = useState<
    Record<FileTreeSource, RootSummary | null>
  >({ desktop: null, repository: null });
  const handleSummary = useCallback(
    (summary: RootSummary) =>
      setRootSummaries((current) => ({
        ...current,
        [fileTreeSource]: summary,
      })),
    [fileTreeSource],
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
      const [base, hash] = href.split("#");
      const targetPath = base === "" ? "/" : base;
      if (pathname !== targetPath) return;

      event.preventDefault();
      const scrollToHash = () => {
        const target = document.getElementById(hash);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      const nextUrl = `${window.location.pathname}${window.location.search}#${hash}`;
      window.history.pushState(null, "", nextUrl);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      scrollToHash();
    },
    [onNavigate, pathname],
  );

  return (
    <div className="flex h-full w-full">
      <div className="flex w-[72px] shrink-0 flex-col items-center border-r border-[#1d1831] bg-[#221d38] py-3">
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
                onClick={(event) => handleNavClick(event, item.href)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border border-white/12 bg-white/7 text-[#d8d0c6] transition hover:bg-white/14 hover:text-white",
                  active &&
                    "border-[#d66b43] bg-[#cf623d] text-white hover:bg-[#cf623d]",
                )}
                aria-label={`${item.label} — ${item.description}`}
                aria-current={active ? "page" : undefined}
                title={`${item.label}\n${item.description}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </Link>
            );
          })}
        </nav>
      </div>

      <FilePanel
        source={fileTreeSource}
        onSourceChange={setFileTreeSource}
        filter={filter}
        onFilterChange={setFilter}
        onRootSummary={handleSummary}
        rootSummary={rootSummaries[fileTreeSource]}
        className="min-w-0 flex-1 overflow-y-auto border-r border-[#d2c8b8] bg-[#f1eee5]/94 px-3 py-4"
      />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden h-full w-[372px] shrink-0 self-stretch lg:flex">
      <SidebarContent />
    </aside>
  );
}
