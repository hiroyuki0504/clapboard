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
  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f1e8] text-[#312d27]">
      <div className="grid h-9 grid-cols-[1fr_auto_1fr] items-center border-b border-[#cfc6b8] bg-[#e8e2d7] px-4 text-xs text-[#70675b]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#e98572] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#e5c86b] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#8bb17f] ring-1 ring-black/10" />
        </div>
        <div className="hidden font-medium sm:block">
          ClawBoard — Progress Management Workspace
        </div>
        <div className="flex justify-end gap-2">
          <span className="rounded-full border border-[#a8bed4] bg-[#eef4f8] px-3 py-1 text-[#315a78]">
            Agent: 待機中
          </span>
          <Suspense fallback={<WorkspaceStreamPillFallback />}>
            <WorkspaceStreamPill />
          </Suspense>
        </div>
      </div>
      <div className="flex h-[calc(100vh-36px)] overflow-hidden">
        <Sidebar
          agentSummary={
            <Suspense fallback={<SidebarAgentSummaryFallback />}>
              <SidebarAgentSummary />
            </Suspense>
          }
        />
        <div className="flex min-w-0 flex-1 flex-col bg-[#fbfaf5]">
          <Topbar />
          <main className="thin-scrollbar min-h-0 flex-1 overflow-auto p-3 sm:p-4 lg:p-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
