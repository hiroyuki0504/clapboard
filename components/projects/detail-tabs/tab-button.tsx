"use client";

import { cn } from "@/lib/utils";
import type { TabKey } from "./tab-config";

export function ProjectDetailTabButton({
  tabKey,
  label,
  icon: Icon,
  active,
  onSelect,
  onKeyDown,
}: {
  tabKey: TabKey;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onSelect: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      tabIndex={active ? 0 : -1}
      data-project-detail-tab={tabKey}
      onClick={onSelect}
      onKeyDown={onKeyDown}
      className={cn(
        "inline-flex h-10 min-w-[88px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-bold text-[#70675b] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c95d3a] sm:flex-1 sm:px-4",
        active && "bg-[#312d27] text-white shadow-sm",
        !active && "hover:bg-[#fffefa] hover:text-[#312d27]",
      )}
      type="button"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
