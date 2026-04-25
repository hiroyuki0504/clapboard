import type { Project, ProjectTask } from "@/lib/types";

export function getProjectBudgetBalance(
  project: Pick<Project, "revenue" | "cost">,
) {
  return project.revenue - project.cost;
}

export function getActiveProjects<T extends Pick<Project, "status">>(projects: T[]) {
  return projects.filter((project) => project.status !== "completed");
}

export function getAverageProgress(projects: Array<Pick<Project, "progress">>) {
  if (projects.length === 0) {
    return 0;
  }

  return Math.round(
    projects.reduce((total, project) => total + project.progress, 0) /
      projects.length,
  );
}

export function getOpenTasks<T extends Pick<ProjectTask, "completed">>(
  tasks: T[],
) {
  return tasks.filter((task) => !task.completed);
}

export function getCompletedTasks<T extends Pick<ProjectTask, "completed">>(
  tasks: T[],
) {
  return tasks.filter((task) => task.completed);
}

export function getOpenTaskCount(tasks: Pick<ProjectTask, "completed">[]) {
  return getOpenTasks(tasks).length;
}

export function getHighPriorityOpenTasks<
  T extends Pick<ProjectTask, "completed" | "priority">,
>(tasks: T[]) {
  return getOpenTasks(tasks).filter((task) => task.priority === "high");
}

export function getHighPriorityOpenTaskCount(
  tasks: Pick<ProjectTask, "completed" | "priority">[],
) {
  return getHighPriorityOpenTasks(tasks).length;
}

export function getTaskCompletion(tasks: ProjectTask[]) {
  if (tasks.length === 0) {
    return 0;
  }

  const completed = tasks.filter((task) => task.completed).length;

  return Math.round((completed / tasks.length) * 100);
}
