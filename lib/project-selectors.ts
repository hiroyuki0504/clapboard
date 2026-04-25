import type { Project, ProjectTask } from "./types";
import { safeDate, safeDateTime } from "./utils";

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

export function getLatestTaskProjectDate(
  projects: Project[],
  priority: ProjectTask["priority"],
) {
  return projects
    .filter((project) =>
      project.tasks.some(
        (task) => !task.completed && task.priority === priority,
      ),
    )
    .sort(
      (a, b) => safeDateTime(b.lastUpdated, 0) - safeDateTime(a.lastUpdated, 0),
    )[0]?.lastUpdated;
}

export function getNextMilestoneDate(projects: Project[]) {
  return projects
    .filter((project) => safeDate(project.dueDate) !== null)
    .sort(
      (a, b) =>
        safeDateTime(a.dueDate, Number.POSITIVE_INFINITY) -
        safeDateTime(b.dueDate, Number.POSITIVE_INFINITY),
    )[0]?.dueDate;
}
