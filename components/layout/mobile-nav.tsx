"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavItemActive, railItems } from "./nav-items";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);


  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="メニューを開く"
        aria-expanded={open}
        aria-controls="mobile-nav-drawer"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#bfb6a8] bg-[#fffefa] text-[#312d27] transition hover:bg-[#f6f1e7] lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="ナビゲーション"
          id="mobile-nav-drawer"
        >
          <button
            type="button"
            aria-label="メニューを閉じる"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="thin-scrollbar fixed left-3 right-3 top-3 z-[110] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-lg border border-[#423c33]/55 bg-[#f1eee5] p-3 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-black text-[#312d27]">メニュー</p>
              <button
                type="button"
                aria-label="メニューを閉じる"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white/95 text-[#312d27] shadow-sm transition hover:bg-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <nav className="mt-3 grid gap-2" aria-label="主要ナビゲーション">
              {railItems.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item, pathname, currentHash);

                return (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-11 items-center gap-3 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm font-bold text-[#5f574d] transition hover:border-[#c95d3a] hover:text-[#312d27]",
                      active &&
                        "border-[#d66b43] bg-[#cf623d] text-white hover:bg-[#cf623d] hover:text-white",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
