import assert from "node:assert/strict";
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

  assert.match(markup, /案件名/);
  assert.match(markup, /クライアント/);
  assert.match(markup, /ステータス/);
  assert.match(markup, /進捗/);
  assert.match(markup, /最終更新/);
  assert.match(markup, /収支/);
  assert.match(markup, /コーポレートサイト刷新/);
  assert.match(markup, /AI議事録自動化/);
  assert.match(markup, /進行中/);
  assert.match(markup, /レビュー/);
  assert.match(markup, /href="\/projects\/web-renewal"/);
  assert.match(markup, /href="\/projects\/ai-minutes"/);
});
