import type { Project } from "./types";

export type DetailTab = "overview" | "progress" | "minutes" | "finance" | "files";

export function projectDetailHref(projectId: string, tab: DetailTab) {
  return tab === "overview"
    ? `/projects/${projectId}`
    : `/projects/${projectId}?tab=${tab}`;
}

export function getProjectDashboardTab(
  project: Pick<Project, "tasks" | "minutes">,
): DetailTab {
  const hasBlocker = project.tasks.some(
    (task) => !task.completed && task.priority === "high",
  );

  if (hasBlocker) {
    return "progress";
  }

  if (project.minutes.length > 0) {
    return "minutes";
  }

  return "overview";
}
