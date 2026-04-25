"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { projects } from "@/lib/mock-data";
import { readProjectsWithSnapshots } from "@/lib/project-persistence";
import type { Project } from "@/lib/types";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [projectList, setProjectList] = useState<Project[]>(projects);
  const reviewCount = getReviewCount(projectList);
  const unresolvedCount = getUnresolvedCount(projectList);
  const attentionCount = reviewCount + unresolvedCount;

  useEffect(() => {
    setProjectList(readProjectsWithSnapshots(projects));
  }, []);

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4f1e8] text-[#312d27]">
      <div className="grid h-9 grid-cols-[1fr_auto_1fr] items-center border-b border-[#cfc6b8] bg-[#e8e2d7] px-4 text-xs text-[#70675b]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#e98572] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#e5c86b] ring-1 ring-black/10" />
          <span className="h-3 w-3 rounded-full bg-[#8bb17f] ring-1 ring-black/10" />
        </div>
        <div className="hidden font-medium sm:block">
          ClawBoard — Project Management Workspace
        </div>
        <div className="flex justify-end gap-2">
          <span className="rounded-full border border-[#a8bed4] bg-[#eef4f8] px-3 py-1 text-[#315a78]">
            Agent: {attentionCount > 0 ? `確認 ${attentionCount}件` : "待機中"}
          </span>
          <span className="rounded-full border border-[#c8c0b3] bg-[#fffefa] px-3 py-1">
            {projectList.length} projects
          </span>
        </div>
      </div>
      <div className="flex h-[calc(100vh-36px)] overflow-hidden">
        <Sidebar />
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

function getReviewCount(projects: Project[]) {
  return projects.reduce((total, project) => {
    const pendingImports = project.imports.filter(
      (entry) => entry.extractionStatus !== "reviewed",
    ).length;
    const pendingSuggestions = project.imports.reduce(
      (count, entry) =>
        count +
        (entry.suggestions ?? []).filter((suggestion) => suggestion.status === "pending")
          .length,
      0,
    );

    return total + pendingImports + pendingSuggestions;
  }, 0);
}

function getUnresolvedCount(projects: Project[]) {
  return projects.reduce(
    (total, project) =>
      total + project.ambiguities.filter((ambiguity) => !ambiguity.resolved).length,
    0,
  );
}
