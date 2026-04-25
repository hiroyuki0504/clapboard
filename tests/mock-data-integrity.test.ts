import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import { after, test } from "node:test";

const outputRoot = path.resolve(process.cwd(), "out/test-build");
const requireFromOutput = createRequire(
  path.join(outputRoot, "tests", "mock-data-integrity.test.js"),
);

type ModuleWithResolver = typeof Module & {
  _resolveFilename(
    request: string,
    parent: NodeJS.Module | undefined,
    isMain: boolean,
    options?: unknown,
  ): string;
};

const moduleWithResolver = Module as ModuleWithResolver;
const originalResolveFilename = moduleWithResolver._resolveFilename;

moduleWithResolver._resolveFilename = function resolveWithTestAliases(
  request,
  parent,
  isMain,
  options,
) {
  if (request.startsWith("@/")) {
    return originalResolveFilename.call(
      this,
      path.join(outputRoot, request.slice(2)),
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};

after(() => {
  moduleWithResolver._resolveFilename = originalResolveFilename;
});

const PROJECT_STATUSES = new Set([
  "planning",
  "in-progress",
  "review",
  "at-risk",
  "completed",
]);
const TASK_PRIORITIES = new Set(["high", "medium", "low"]);
const TRANSACTION_TYPES = new Set(["revenue", "expense"]);
const FILE_TYPES = new Set(["docs", "sheet", "slide", "folder", "pdf"]);

test("mock projects keep stable ids, dates, and enum values", () => {
  const { projects } = requireFromOutput(
    "../lib/mock-data",
  ) as typeof import("../lib/mock-data");

  assert.ok(projects.length > 0, "mock projects should not be empty");
  assertUnique("project ids", projects.map((project) => project.id));

  for (const project of projects) {
    assertNonEmpty(project.id, `${project.id}.id`);
    assertNonEmpty(project.name, `${project.id}.name`);
    assertNonEmpty(project.client, `${project.id}.client`);
    assertNonEmpty(project.owner, `${project.id}.owner`);
    assertNonEmpty(project.summary, `${project.id}.summary`);
    assert.ok(PROJECT_STATUSES.has(project.status), `${project.id}.status`);
    assertNumberRange(project.progress, 0, 100, `${project.id}.progress`);
    assertNonNegative(project.revenue, `${project.id}.revenue`);
    assertNonNegative(project.cost, `${project.id}.cost`);
    assertDateTime(project.lastUpdated, `${project.id}.lastUpdated`);
    assertDateOnly(project.dueDate, `${project.id}.dueDate`);

    assertUnique(
      `${project.id}.update ids`,
      project.updates.map((update) => update.id),
    );
    assertUnique(
      `${project.id}.task ids`,
      project.tasks.map((task) => task.id),
    );
    assertUnique(
      `${project.id}.minute ids`,
      project.minutes.map((minute) => minute.id),
    );
    assertUnique(
      `${project.id}.transaction ids`,
      project.transactions.map((transaction) => transaction.id),
    );
    assertUnique(
      `${project.id}.file ids`,
      project.files.map((file) => file.id),
    );

    for (const update of project.updates) {
      assertNonEmpty(update.text, `${project.id}.${update.id}.text`);
      assertDateTime(update.date, `${project.id}.${update.id}.date`);
    }

    for (const task of project.tasks) {
      assertNonEmpty(task.title, `${project.id}.${task.id}.title`);
      assertNonEmpty(task.note, `${project.id}.${task.id}.note`);
      assert.equal(
        typeof task.completed,
        "boolean",
        `${project.id}.${task.id}.completed`,
      );
      assert.ok(
        TASK_PRIORITIES.has(task.priority),
        `${project.id}.${task.id}.priority`,
      );
    }

    for (const minute of project.minutes) {
      assertNonEmpty(minute.title, `${project.id}.${minute.id}.title`);
      assertNonEmpty(minute.body, `${project.id}.${minute.id}.body`);
      assertDateTime(minute.createdAt, `${project.id}.${minute.id}.createdAt`);
      assert.ok(
        minute.participants.every((participant) => participant.trim().length > 0),
        `${project.id}.${minute.id}.participants`,
      );
    }

    for (const transaction of project.transactions) {
      assertNonEmpty(transaction.label, `${project.id}.${transaction.id}.label`);
      assertDateOnly(transaction.date, `${project.id}.${transaction.id}.date`);
      assert.ok(
        TRANSACTION_TYPES.has(transaction.type),
        `${project.id}.${transaction.id}.type`,
      );
      assertNonNegative(
        transaction.amount,
        `${project.id}.${transaction.id}.amount`,
      );
    }

    for (const file of project.files) {
      assertNonEmpty(file.name, `${project.id}.${file.id}.name`);
      assert.ok(FILE_TYPES.has(file.type), `${project.id}.${file.id}.type`);
      assertDateTime(file.updatedAt, `${project.id}.${file.id}.updatedAt`);
      assert.match(file.url, /^https?:\/\//, `${project.id}.${file.id}.url`);
    }
  }
});

test("mock aggregate feeds stay linked to projects and sorted newest first", () => {
  const { allFiles, allMinutes, projects } = requireFromOutput(
    "../lib/mock-data",
  ) as typeof import("../lib/mock-data");
  const projectNames = new Set(projects.map((project) => project.name));

  assert.equal(
    allFiles.length,
    projects.reduce((total, project) => total + project.files.length, 0),
  );
  assert.equal(
    allMinutes.length,
    projects.reduce((total, project) => total + project.minutes.length, 0),
  );
  assert.ok(
    allFiles.every((file) => projectNames.has(file.projectName)),
    "all files should reference an existing project name",
  );
  assert.ok(
    allMinutes.every((minute) => projectNames.has(minute.projectName)),
    "all minutes should reference an existing project name",
  );
  assertSortedDescending(
    "allFiles.updatedAt",
    allFiles.map((file) => file.updatedAt),
  );
  assertSortedDescending(
    "allMinutes.createdAt",
    allMinutes.map((minute) => minute.createdAt),
  );
});

function assertUnique(label: string, values: string[]) {
  assert.equal(new Set(values).size, values.length, `${label} should be unique`);
}

function assertNonEmpty(value: string, label: string) {
  assert.ok(value.trim().length > 0, `${label} should not be empty`);
}

function assertNumberRange(
  value: number,
  min: number,
  max: number,
  label: string,
) {
  assert.ok(Number.isFinite(value), `${label} should be finite`);
  assert.ok(value >= min && value <= max, `${label} should be ${min}-${max}`);
}

function assertNonNegative(value: number, label: string) {
  assert.ok(Number.isFinite(value), `${label} should be finite`);
  assert.ok(value >= 0, `${label} should be non-negative`);
}

function assertDateOnly(value: string, label: string) {
  assert.match(value, /^\d{4}-\d{2}-\d{2}$/, `${label} should be YYYY-MM-DD`);
  assertDateTime(`${value}T00:00:00+09:00`, label);
}

function assertDateTime(value: string, label: string) {
  assert.ok(!Number.isNaN(new Date(value).getTime()), `${label} should parse`);
}

function assertSortedDescending(label: string, values: string[]) {
  const times = values.map((value) => new Date(value).getTime());

  for (let index = 1; index < times.length; index += 1) {
    assert.ok(times[index - 1] >= times[index], `${label} should be descending`);
  }
}
