import type { Project, ProjectTask } from "@/lib/types";

export function getProjectBudgetBalance(
  project: Pick<Project, "revenue" | "cost">,
) {
  return project.revenue - project.cost;
}

export function getOpenTasks(tasks: ProjectTask[]) {
  return tasks.filter((task) => !task.completed);
}

export function getOpenTaskCount(tasks: ProjectTask[]) {
  return getOpenTasks(tasks).length;
}

export function getHighPriorityOpenTaskCount(tasks: ProjectTask[]) {
  return getOpenTasks(tasks).filter((task) => task.priority === "high").length;
}

export function getTaskCompletion(tasks: ProjectTask[]) {
  if (tasks.length === 0) {
    return 0;
  }

  const completed = tasks.filter((task) => task.completed).length;

  return Math.round((completed / tasks.length) * 100);
}
