import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getActiveProjects,
  getAverageProgress,
  getCompletedTasks,
  getHighPriorityOpenTaskCount,
  getHighPriorityOpenTasks,
  getOpenTaskCount,
  getOpenTasks,
  getProjectBudgetBalance,
  getTaskCompletion,
} from "../lib/project-selectors";
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
