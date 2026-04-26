import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getActiveProjects,
  getAverageProgress,
  getCompletedTasks,
  getHighPriorityOpenTaskCount,
  getHighPriorityOpenTasks,
  getLatestTaskProjectDate,
  getNextMilestoneDate,
  getOpenTaskCount,
  getOpenTasks,
  getProjectPrioritySignals,
  getTopProjectPrioritySignal,
  getProjectBudgetBalance,
  getTaskCompletion,
} from "../lib/project-selectors";
import {
  getProjectDashboardTab,
  projectDetailHref,
} from "../lib/project-href";
import type { Project, ProjectTask } from "../lib/types";

const tasks: ProjectTask[] = [
  {
    id: "task-1",
    title: "重要な未完了タスク",
    completed: false,
    priority: "high",
    note: "ブロッカーとして扱う",
  },
  {
    id: "task-2",
    title: "通常の未完了タスク",
    completed: false,
    priority: "medium",
    note: "対応待ち",
  },
  {
    id: "task-3",
    title: "完了済みタスク",
    completed: true,
    priority: "high",
    note: "完了済みなのでブロッカーに含めない",
  },
];

test("project selectors summarize task and budget state", () => {
  assert.equal(getProjectBudgetBalance({ revenue: 120000, cost: 45000 }), 75000);
  assert.equal(getTaskCompletion(tasks), 33);
  assert.equal(getTaskCompletion([]), 0);
  assert.deepEqual(getOpenTasks(tasks).map((task) => task.id), [
    "task-1",
    "task-2",
  ]);
  assert.deepEqual(getCompletedTasks(tasks).map((task) => task.id), ["task-3"]);
  assert.equal(getOpenTaskCount(tasks), 2);
  assert.deepEqual(getHighPriorityOpenTasks(tasks).map((task) => task.id), [
    "task-1",
  ]);
  assert.equal(getHighPriorityOpenTaskCount(tasks), 1);
});

test("project selectors summarize project list state", () => {
  const projects: Array<Pick<Project, "status" | "progress">> = [
    { status: "in-progress", progress: 50 },
    { status: "completed", progress: 100 },
    { status: "review", progress: 34 },
  ];

  assert.deepEqual(getActiveProjects(projects), [projects[0], projects[2]]);
  assert.equal(getAverageProgress(projects), 61);
  assert.equal(getAverageProgress([]), 0);
});

function makeProject(partial: Partial<Project> & Pick<Project, "id">): Project {
  return {
    name: partial.name ?? partial.id,
    client: "client",
    status: "in-progress",
    progress: 0,
    lastUpdated: "2026-01-01T00:00:00Z",
    revenue: 0,
    cost: 0,
    dueDate: "2026-12-31",
    owner: "owner",
    summary: "",
    updates: [],
    tasks: [],
    minutes: [],
    transactions: [],
    files: [],
    ...partial,
  };
}

test("getLatestTaskProjectDate picks the most recently updated project containing the priority", () => {
  const projects: Project[] = [
    makeProject({
      id: "old-blocker",
      lastUpdated: "2026-03-01T00:00:00Z",
      tasks: [
        {
          id: "t1",
          title: "古いブロッカー",
          completed: false,
          priority: "high",
          note: "",
        },
      ],
    }),
    makeProject({
      id: "newer-blocker",
      lastUpdated: "2026-04-01T00:00:00Z",
      tasks: [
        {
          id: "t2",
          title: "新しいブロッカー",
          completed: false,
          priority: "high",
          note: "",
        },
      ],
    }),
    makeProject({
      id: "no-blocker",
      lastUpdated: "2026-05-01T00:00:00Z",
      tasks: [
        {
          id: "t3",
          title: "通常",
          completed: false,
          priority: "medium",
          note: "",
        },
      ],
    }),
  ];

  assert.equal(
    getLatestTaskProjectDate(projects, "high"),
    "2026-04-01T00:00:00Z",
  );
  assert.equal(getLatestTaskProjectDate([], "high"), undefined);
});

test("getNextMilestoneDate returns the earliest valid due date and skips invalid ones", () => {
  const projects: Project[] = [
    makeProject({ id: "a", dueDate: "2026-08-01" }),
    makeProject({ id: "b", dueDate: "invalid-date" }),
    makeProject({ id: "c", dueDate: "2026-05-15" }),
  ];

  assert.equal(getNextMilestoneDate(projects), "2026-05-15");
  assert.equal(getNextMilestoneDate([]), undefined);
});

test("getProjectPrioritySignals ranks due dates and open task risks", () => {
  const now = new Date("2026-04-26T10:00:00+09:00");
  const projects: Project[] = [
    makeProject({
      id: "review",
      name: "レビュー案件",
      status: "review",
      dueDate: "2026-05-10",
    }),
    makeProject({
      id: "overdue",
      name: "期限超過案件",
      dueDate: "2026-04-25",
      tasks: [
        {
          id: "t1",
          title: "仕様を再合意",
          completed: false,
          priority: "high",
          note: "",
        },
      ],
    }),
    makeProject({
      id: "healthy",
      name: "正常案件",
      dueDate: "2026-07-01",
      tasks: [
        {
          id: "t2",
          title: "完了済み",
          completed: true,
          priority: "high",
          note: "",
        },
      ],
    }),
  ];

  const signals = getProjectPrioritySignals(projects, now);

  assert.equal(signals[0].projectId, "overdue");
  assert.equal(signals[0].dueInDays, -1);
  assert.equal(signals[0].actionLabel, "「仕様を再合意」を確認");
  assert.deepEqual(signals[0].reasonTypes, [
    "overdue",
    "high-open-tasks",
    "open-tasks",
  ]);
  assert.deepEqual(
    signals.map((signal) => signal.projectId),
    ["overdue", "review"],
  );
});

test("getProjectPrioritySignals treats due soon as an inclusive 7 day boundary", () => {
  const now = new Date("2026-04-26T23:30:00+09:00");
  const projects: Project[] = [
    makeProject({ id: "seven-days", dueDate: "2026-05-03" }),
    makeProject({ id: "eight-days", dueDate: "2026-05-04" }),
    makeProject({ id: "invalid", dueDate: "not-a-date" }),
  ];

  const signals = getProjectPrioritySignals(projects, now);

  assert.equal(signals.length, 1);
  assert.equal(signals[0].projectId, "seven-days");
  assert.equal(signals[0].dueInDays, 7);
  assert.deepEqual(signals[0].reasonTypes, ["due-soon"]);
});

test("getProjectPrioritySignals reports budget risk thresholds", () => {
  const now = new Date("2026-04-26T10:00:00+09:00");
  const projects: Project[] = [
    makeProject({ id: "negative", revenue: 100, cost: 120 }),
    makeProject({ id: "unbilled", revenue: 0, cost: 10 }),
    makeProject({ id: "tight", revenue: 100, cost: 85 }),
    makeProject({ id: "healthy", revenue: 100, cost: 84 }),
  ];

  const signals = getProjectPrioritySignals(projects, now);

  assert.deepEqual(
    signals.map((signal) => [signal.projectId, signal.reasonTypes[0]]),
    [
      ["negative", "budget-negative"],
      ["unbilled", "budget-unbilled"],
      ["tight", "budget-tight"],
    ],
  );
  assert.equal(signals[0].targetTab, "finance");
  assert.equal(
    signals.some((signal) => signal.projectId === "healthy"),
    false,
  );
});

test("getTopProjectPrioritySignal skips completed projects", () => {
  const now = new Date("2026-04-26T10:00:00+09:00");
  const projects: Project[] = [
    makeProject({
      id: "completed",
      status: "completed",
      dueDate: "2026-04-20",
    }),
    makeProject({
      id: "active",
      dueDate: "2026-04-26",
    }),
  ];

  const topSignal = getTopProjectPrioritySignal(projects, now);

  assert.equal(topSignal?.projectId, "active");
  assert.equal(topSignal?.actionLabel, "本日期限の完了条件を確認");
  assert.equal(getTopProjectPrioritySignal([], now), undefined);
});

test("projectDetailHref omits the tab query for overview", () => {
  assert.equal(projectDetailHref("p-1", "overview"), "/projects/p-1");
  assert.equal(
    projectDetailHref("p-1", "progress"),
    "/projects/p-1?tab=progress",
  );
});

test("getProjectDashboardTab prefers progress for blockers, then minutes", () => {
  const blocking = makeProject({
    id: "blocker",
    tasks: [
      { id: "t", title: "B", completed: false, priority: "high", note: "" },
    ],
  });
  const meeting = makeProject({
    id: "meeting",
    minutes: [
      {
        id: "m",
        title: "週次",
        createdAt: "",
        participants: [],
        body: "",
      },
    ],
  });
  const empty = makeProject({ id: "empty" });

  assert.equal(getProjectDashboardTab(blocking), "progress");
  assert.equal(getProjectDashboardTab(meeting), "minutes");
  assert.equal(getProjectDashboardTab(empty), "overview");
});
