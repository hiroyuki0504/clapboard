import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import { after, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const outputRoot = path.resolve(process.cwd(), "out/test-build");
const requireFromOutput = createRequire(
  path.join(outputRoot, "tests", "ui-regression.test.js"),
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

test("ProjectTable keeps its primary columns, labels, and detail links", () => {
  const { ProjectTable } = requireFromOutput(
    "../components/projects/project-table",
  ) as typeof import("../components/projects/project-table");
  const { projects } = requireFromOutput("../lib/mock-data") as typeof import("../lib/mock-data");

  const markup = renderToStaticMarkup(
    React.createElement(ProjectTable, { projects: projects.slice(0, 2) }),
  );

  assert.match(markup, /ワークストリーム/);
  assert.match(markup, /オーナー/);
  assert.match(markup, /状態/);
  assert.match(markup, /進捗率/);
  assert.match(markup, /次の節目/);
  assert.match(markup, /リスク/);
  assert.match(markup, /コーポレートサイト刷新/);
  assert.match(markup, /AI議事録自動化/);
  assert.match(markup, /進行中/);
  assert.match(markup, /レビュー/);
  assert.match(markup, /aria-label="コーポレートサイト刷新を開く"/);
  assert.match(markup, /aria-label="AI議事録自動化を開く"/);
  assert.match(markup, /href="\/projects\/web-renewal"/);
  assert.match(markup, /href="\/projects\/ai-minutes"/);
});

test("ProjectDetailTabs keeps URL query tab synchronization", () => {
  const tabsSource = readFileSync(
    path.join(process.cwd(), "components/projects/project-detail-tabs.tsx"),
    "utf8",
  );
  const tabConfigSource = readFileSync(
    path.join(
      process.cwd(),
      "components/projects/detail-tabs/tab-config.ts",
    ),
    "utf8",
  );
  const tabNavigationSource = readFileSync(
    path.join(
      process.cwd(),
      "components/projects/detail-tabs/use-tab-navigation.ts",
    ),
    "utf8",
  );

  assert.match(
    tabConfigSource,
    /new URLSearchParams\(window\.location\.search\)\.get\("tab"\)/,
  );
  assert.match(tabConfigSource, /isTabKey\(tab\)/);
  assert.match(
    tabNavigationSource,
    /window\.addEventListener\("popstate", syncTabFromUrl\)/,
  );
  assert.match(tabNavigationSource, /url\.searchParams\.set\("tab", tabKey\)/);
  assert.match(tabNavigationSource, /url\.searchParams\.delete\("tab"\)/);
  assert.match(tabNavigationSource, /window\.history\.pushState/);
  assert.match(tabNavigationSource, /event\.key === "ArrowRight"/);
  assert.match(tabNavigationSource, /event\.key === "ArrowLeft"/);
  assert.match(tabNavigationSource, /event\.key === "Home"/);
  assert.match(tabNavigationSource, /event\.key === "End"/);
  const tabButtonSource = readFileSync(
    path.join(
      process.cwd(),
      "components/projects/detail-tabs/tab-button.tsx",
    ),
    "utf8",
  );

  assert.match(
    tabsSource,
    /onKeyDown=\{\(event\) => handleTabKeyDown\(event, tab\.key\)\}/,
  );
  assert.match(tabButtonSource, /tabIndex=\{active \? 0 : -1\}/);
  assert.match(tabButtonSource, /whitespace-nowrap/);
});

test("Dashboard stat pills link to actionable views", () => {
  const { StatPills } = requireFromOutput(
    "../components/dashboard/stat-pills",
  ) as typeof import("../components/dashboard/stat-pills");

  const markup = renderToStaticMarkup(
    React.createElement(StatPills, {
      activeCount: 3,
      averageProgress: 64,
      completedCount: 8,
      blockerCount: 2,
    }),
  );

  assert.match(markup, /href="\/projects"/);
  assert.match(markup, /href="\/projects\?sort=progress"/);
  assert.match(markup, /href="\/tasks"/);
  assert.match(markup, /href="\/projects\?sort=blockers"/);
});

test("TimelineGrid exposes delete controls for calendar events", () => {
  const { TimelineGrid } = requireFromOutput(
    "../components/timeline/timeline-grid",
  ) as typeof import("../components/timeline/timeline-grid");

  const markup = renderToStaticMarkup(
    React.createElement(TimelineGrid, {
      dateKeys: ["2026-04-26"],
      todayKey: "2026-04-26",
      events: [
        {
          id: "event-1",
          lane: "agent",
          dateKey: "2026-04-26",
          title: "レビュー打ち合わせ",
          sub: "ユーザー追加",
          tone: "slate",
        },
      ],
      onDeleteEvent: () => {},
    }),
  );

  assert.match(markup, /レビュー打ち合わせ/);
  assert.match(markup, /aria-label="予定「レビュー打ち合わせ」を削除"/);
});

test("TodoSection exposes selectable task actions", () => {
  const todoSectionSource = readFileSync(
    path.join(process.cwd(), "components/dashboard/todo-section.tsx"),
    "utf8",
  );

  assert.match(todoSectionSource, /type="checkbox"/);
  assert.match(todoSectionSource, /selected \{selectedCount\}/);
  assert.match(todoSectionSource, /処理済み/);
  assert.match(todoSectionSource, /今日から外す/);
  assert.match(todoSectionSource, /clapboard:hidden-today-tasks:/);
});
