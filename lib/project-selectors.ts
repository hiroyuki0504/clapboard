import type {
  Project,
  ProjectFile,
  ProjectMinute,
  ProjectTask,
} from "./types";
import { safeDate, safeDateTime } from "./utils";

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PRIORITY_TIME_ZONE = "Asia/Tokyo";
const DUE_SOON_DAYS = 7;
const BUDGET_RISK_COST_RATIO = 0.85;

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

export type ProjectPriorityReasonType =
  | "overdue"
  | "due-today"
  | "due-soon"
  | "high-open-tasks"
  | "open-tasks"
  | "review-waiting"
  | "budget-negative"
  | "budget-unbilled"
  | "budget-tight";

export type ProjectPrioritySignal = {
  projectId: string;
  projectName: string;
  score: number;
  actionLabel: string;
  reasonLabels: string[];
  reasonTypes: ProjectPriorityReasonType[];
  targetTab: "overview" | "progress" | "finance";
  dueInDays?: number;
};

type PriorityReason = {
  type: ProjectPriorityReasonType;
  label: string;
  score: number;
  targetTab: ProjectPrioritySignal["targetTab"];
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

export function getProjectPrioritySignals(
  projects: Project[],
  now: Date,
): ProjectPrioritySignal[] {
  return projects
    .flatMap((project) => {
      if (project.status === "completed") {
        return [];
      }

      const reasons: PriorityReason[] = [];
      const openTasks = getOpenTasks(project.tasks);
      const highOpenTasks = getHighPriorityOpenTasks(project.tasks);
      const dueInDays = getDueInDays(project.dueDate, now);

      if (dueInDays !== undefined) {
        if (dueInDays < 0) {
          reasons.push({
            type: "overdue",
            label: `期限超過${Math.abs(dueInDays)}日`,
            score: 80,
            targetTab: "progress",
          });
        } else if (dueInDays === 0) {
          reasons.push({
            type: "due-today",
            label: "本日期限",
            score: 70,
            targetTab: "progress",
          });
        } else if (dueInDays <= DUE_SOON_DAYS) {
          reasons.push({
            type: "due-soon",
            label: `期限まで${dueInDays}日`,
            score: dueInDays <= 3 ? 55 : 35,
            targetTab: "progress",
          });
        }
      }

      if (highOpenTasks.length > 0) {
        reasons.push({
          type: "high-open-tasks",
          label: `高優先未完了${highOpenTasks.length}件`,
          score: Math.min(45, 18 + highOpenTasks.length * 9),
          targetTab: "progress",
        });
      }

      if (openTasks.length > 0) {
        reasons.push({
          type: "open-tasks",
          label: `未完了${openTasks.length}件`,
          score: Math.min(25, 8 + openTasks.length * 3),
          targetTab: "progress",
        });
      }

      if (project.status === "review") {
        reasons.push({
          type: "review-waiting",
          label: "レビュー待ち",
          score: 34,
          targetTab: "overview",
        });
      }

      const budgetReason = getBudgetPriorityReason(project);
      if (budgetReason) {
        reasons.push(budgetReason);
      }

      if (reasons.length === 0) {
        return [];
      }

      const rankedReasons = [...reasons].sort((a, b) => b.score - a.score);
      const score = rankedReasons.reduce(
        (total, reason) => total + reason.score,
        0,
      );

      return [
        {
          projectId: project.id,
          projectName: project.name,
          score,
          actionLabel: getPriorityActionLabel(
            project,
            openTasks,
            highOpenTasks,
            dueInDays,
            budgetReason,
          ),
          reasonLabels: rankedReasons.map((reason) => reason.label),
          reasonTypes: rankedReasons.map((reason) => reason.type),
          targetTab: rankedReasons[0].targetTab,
          dueInDays,
        },
      ];
    })
    .sort((a, b) => {
      if (a.score !== b.score) {
        return b.score - a.score;
      }

      return (
        (a.dueInDays ?? Number.POSITIVE_INFINITY) -
        (b.dueInDays ?? Number.POSITIVE_INFINITY)
      );
    });
}

export function getTopProjectPrioritySignal(
  projects: Project[],
  now: Date,
) {
  return getProjectPrioritySignals(projects, now)[0];
}

function getDueInDays(dueDate: string, now: Date) {
  const parsedDueDate = safeDate(dueDate);

  if (!parsedDueDate) {
    return undefined;
  }

  return Math.round(
    (getTimeZoneDayTime(parsedDueDate) - getTimeZoneDayTime(now)) / DAY_IN_MS,
  );
}

function getTimeZoneDayTime(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: PRIORITY_TIME_ZONE,
    year: "numeric",
  })
    .formatToParts(value)
    .reduce<Record<string, string>>((accumulator, part) => {
      accumulator[part.type] = part.value;
      return accumulator;
    }, {});

  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}

function getBudgetPriorityReason(
  project: Pick<Project, "revenue" | "cost">,
): PriorityReason | undefined {
  if (project.revenue <= 0 && project.cost > 0) {
    return {
      type: "budget-unbilled",
      label: "売上未計上",
      score: 45,
      targetTab: "finance",
    };
  }

  const budgetBalance = getProjectBudgetBalance(project);

  if (budgetBalance < 0) {
    return {
      type: "budget-negative",
      label: "収支赤字",
      score: 70,
      targetTab: "finance",
    };
  }

  if (
    project.revenue > 0 &&
    project.cost / project.revenue >= BUDGET_RISK_COST_RATIO
  ) {
    return {
      type: "budget-tight",
      label: `原価率${Math.round((project.cost / project.revenue) * 100)}%`,
      score: 40,
      targetTab: "finance",
    };
  }

  return undefined;
}

function getPriorityActionLabel(
  project: Project,
  openTasks: ProjectTask[],
  highOpenTasks: ProjectTask[],
  dueInDays: number | undefined,
  budgetReason: PriorityReason | undefined,
) {
  const topTask = highOpenTasks[0] ?? openTasks[0];

  if (topTask) {
    return `「${topTask.title}」を確認`;
  }

  if (dueInDays !== undefined && dueInDays < 0) {
    return "期限の再調整を確認";
  }

  if (dueInDays === 0) {
    return "本日期限の完了条件を確認";
  }

  if (dueInDays !== undefined && dueInDays <= DUE_SOON_DAYS) {
    return "期限前の残作業を確認";
  }

  if (project.status === "review") {
    return "レビュー結果を確定";
  }

  if (budgetReason) {
    return "収支条件を確認";
  }

  return "進捗を確認";
}
