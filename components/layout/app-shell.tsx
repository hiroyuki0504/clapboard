import { Suspense } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import {
  SidebarAgentSummary,
  SidebarAgentSummaryFallback,
} from "@/components/layout/workspace-summary";

export function AppShell({ children }: { children: React.ReactNode }) {
  const agentSummary = (
    <Suspense fallback={<SidebarAgentSummaryFallback />}>
      <SidebarAgentSummary />
    </Suspense>
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#f4f1e8] text-[#312d27]">
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
