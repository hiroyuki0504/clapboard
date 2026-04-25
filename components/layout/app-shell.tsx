import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import {
  SidebarAgentSummary,
  SidebarAgentSummaryFallback,
  WorkspaceStreamPill,
  WorkspaceStreamPillFallback,
} from "@/components/layout/workspace-summary";

export function AppShell({ children }: { children: React.ReactNode }) {
  const agentSummary = (
    <Suspense fallback={<SidebarAgentSummaryFallback />}>
      <SidebarAgentSummary />
    </Suspense>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f1e8] text-[#312d27]">
      <div className="hidden h-9 shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-[#cfc6b8] bg-[#e8e2d7] px-4 text-xs text-[#70675b] sm:grid">
        <div className="flex items-center gap-2" aria-hidden>
          <span className="h-3 w-3 rounded-full bg-[#e98572] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#e5c86b] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#8bb17f] ring-1 ring-black/10" />
        </div>
        <div className="hidden font-medium md:block">
          クラップボード — 案件管理ワークスペース
        </div>
        <div className="flex justify-end gap-2">
          <Suspense fallback={<WorkspaceStreamPillFallback />}>
            <WorkspaceStreamPill />
          </Suspense>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar agentSummary={agentSummary} />
        <div className="flex min-w-0 flex-1 flex-col bg-[#fbfaf5]">
          <Topbar agentSummary={agentSummary} />
          <main className="thin-scrollbar min-h-0 flex-1 overflow-auto p-3 sm:p-4 lg:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
