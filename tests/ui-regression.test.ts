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

  assert.match(
    tabConfigSource,
    /new URLSearchParams\(window\.location\.search\)\.get\("tab"\)/,
  );
  assert.match(tabConfigSource, /isTabKey\(tab\)/);
  assert.match(
    tabsSource,
    /window\.addEventListener\("popstate", syncTabFromUrl\)/,
  );
  assert.match(tabsSource, /url\.searchParams\.set\("tab", tabKey\)/);
  assert.match(tabsSource, /url\.searchParams\.delete\("tab"\)/);
  assert.match(tabsSource, /window\.history\.pushState/);
  assert.match(
    tabsSource,
    /onKeyDown=\{\(event\) => handleTabKeyDown\(event, tab\.key\)\}/,
  );
  assert.match(tabsSource, /event\.key === "ArrowRight"/);
  assert.match(tabsSource, /event\.key === "ArrowLeft"/);
  assert.match(tabsSource, /event\.key === "Home"/);
  assert.match(tabsSource, /event\.key === "End"/);
  assert.match(tabsSource, /tabIndex=\{active \? 0 : -1\}/);
  assert.match(tabsSource, /whitespace-nowrap/);
});
