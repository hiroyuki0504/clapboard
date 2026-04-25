import type {
  Project,
  ProjectFile,
  ProjectMinute,
  ProjectTask,
} from "./types";
import { safeDate, safeDateTime } from "./utils";

export type ProjectTaskWithMeta = ProjectTask & {
  projectId: string;
  projectName: string;
};

export type ProjectFileWithMeta = ProjectFile & {
  projectId: string;
  projectName: string;
};

export type ProjectMinuteWithMeta = ProjectMinute & {
  projectId: string;
  projectName: string;
};

export function getAllProjectTasks(projects: Project[]): ProjectTaskWithMeta[] {
  return projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    })),
  );
}

export function getAllProjectFiles(
  projects: Project[],
): ProjectFileWithMeta[] {
  return projects
    .flatMap((project) =>
      project.files.map((file) => ({
        ...file,
        projectId: project.id,
        projectName: project.name,
      })),
    )
    .sort(
      (a, b) => safeDateTime(b.updatedAt, 0) - safeDateTime(a.updatedAt, 0),
    );
}

export function getAllProjectMinutes(
  projects: Project[],
): ProjectMinuteWithMeta[] {
  return projects
    .flatMap((project) =>
      project.minutes.map((minute) => ({
        ...minute,
        projectId: project.id,
        projectName: project.name,
      })),
    )
    .sort(
      (a, b) => safeDateTime(b.createdAt, 0) - safeDateTime(a.createdAt, 0),
    );
}

export function getRecentlyUpdatedProjects<
  T extends Pick<Project, "lastUpdated">,
>(projects: T[]) {
  return [...projects].sort(
    (a, b) => safeDateTime(b.lastUpdated, 0) - safeDateTime(a.lastUpdated, 0),
  );
}

export function getProjectRevenueTotal(
  projects: Pick<Project, "transactions">[],
) {
  return projects.reduce((total, project) => {
    const revenue = project.transactions
      .filter((transaction) => transaction.type === "revenue")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return total + revenue;
  }, 0);
}

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
