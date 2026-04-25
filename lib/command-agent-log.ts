import type { CodeReviewSystem } from "@/lib/clapboard-api";
import type { Project, ProjectTask } from "@/lib/types";

export type AgentLogEntry = {
  time: string | undefined;
  name: string;
  body: string;
};

type ProjectTaskWithMeta = ProjectTask & {
  projectId: string;
  projectName: string;
};

export function buildAgentLog({
  projects,
  recentProjects,
  reviewSystem,
  openTasks,
  blockerTasks,
  completedTasks,
  activePullRequests,
}: {
  projects: Project[];
  recentProjects: Project[];
  reviewSystem: CodeReviewSystem;
  openTasks: ProjectTaskWithMeta[];
  blockerTasks: ProjectTaskWithMeta[];
  completedTasks: ProjectTaskWithMeta[];
  activePullRequests: CodeReviewSystem["pullRequests"];
}): AgentLogEntry[] {
  return [
    {
      time: recentProjects[0]?.lastUpdated,
      name: "progress_scan",
      body: `${projects.length}件のワークを同期`,
    },
    {
      time: blockerTasks[0] ? recentProjects[0]?.lastUpdated : undefined,
      name: "blocker_detect",
      body: `${blockerTasks.length}件の高優先度タスクを検出`,
    },
    {
      time: reviewSystem.branches[0]?.dueAt,
      name: "review_gate",
      body: `${activePullRequests.length}件のPRをPM確認待ちに分類`,
    },
    {
      time: recentProjects[1]?.lastUpdated,
      name: "todo_refresh",
      body: `${completedTasks.length}件完了 / ${openTasks.length}件未完了`,
    },
  ];
}
