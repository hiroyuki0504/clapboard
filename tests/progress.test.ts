import assert from "node:assert/strict";
import { createRequire } from "node:module";
import Module from "node:module";
import path from "node:path";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const outputRoot = path.resolve(process.cwd(), "out/test-build");
const requireFromOutput = createRequire(
  path.join(outputRoot, "tests", "progress.test.js"),
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

test("Progress clamps values to the accessible range", () => {
  const { Progress } = requireFromOutput(
    "../components/ui/progress",
  ) as typeof import("../components/ui/progress");

  const highMarkup = renderToStaticMarkup(
    React.createElement(Progress, { value: 150 }),
  );
  assert.match(highMarkup, /aria-valuenow="100"/);
  assert.match(highMarkup, /width:100%/);

  const lowMarkup = renderToStaticMarkup(
    React.createElement(Progress, { value: -20 }),
  );
  assert.match(lowMarkup, /aria-valuenow="0"/);
  assert.match(lowMarkup, /width:0%/);
});
