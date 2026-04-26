import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCodeReviewShape } from "../lib/clapboard-api-validators";
import { reviewSystem } from "../lib/code-review-system";

const authorRequiredPriorities = new Set(["crucial", "high"]);
const noCodeInstructionFields = [
  "scope",
  "expectedOutcome",
  "excludedScope",
  "recommendedBranch",
  "verificationCommands",
  "agentPrompt",
] as const;

describe("reviewSystem", () => {
  it("keeps review priorities in PM merge order", () => {
    assert.deepEqual(
      reviewSystem.priorityLevels.map((level) => [
        level.rank,
        level.priority,
      ]),
      [
        [1, "crucial"],
        [2, "high"],
        [3, "medium"],
        [4, "low"],
      ],
    );
  });

  it("does not reuse branch, pull request, or review comment ids", () => {
    assertUnique(reviewSystem.branches.map((branch) => branch.id));
    assertUnique(reviewSystem.pullRequests.map((pullRequest) => pullRequest.id));
    assertUnique(reviewSystem.noCodeRequests.map((request) => request.id));
    assertUnique(
      reviewSystem.pullRequests.flatMap((pullRequest) =>
        pullRequest.comments.map((comment) => comment.id),
      ),
    );
  });

  it("blocks merge gates while author-required comments remain open", () => {
    for (const pullRequest of reviewSystem.pullRequests) {
      const hasAuthorRequiredOpenComment = pullRequest.comments.some(
        (comment) =>
          authorRequiredPriorities.has(comment.priority) &&
          comment.status === "open",
      );

      if (hasAuthorRequiredOpenComment) {
        assert.equal(pullRequest.gate, "blocked", pullRequest.id);
      }
    }
  });

  it("keeps no-code requests ready for agent handoff", () => {
    for (const request of reviewSystem.noCodeRequests) {
      assert.ok(request.scope.length > 0, `${request.id}.scope`);
      assert.ok(
        request.expectedOutcome.length > 0,
        `${request.id}.expectedOutcome`,
      );
      assert.ok(
        request.excludedScope.length > 0,
        `${request.id}.excludedScope`,
      );
      assert.match(
        request.recommendedBranch,
        /^codex\//,
        `${request.id}.recommendedBranch`,
      );
      assert.ok(
        request.verificationCommands.length > 0,
        `${request.id}.verificationCommands`,
      );
      assert.ok(
        request.verificationCommands.every((command) => command.length > 0),
        `${request.id}.verificationCommands`,
      );
      assert.ok(request.agentPrompt.length > 0, `${request.id}.agentPrompt`);
    }
  });

  it("accepts the mock code-review payload in the API validator", () => {
    assert.equal(isCodeReviewShape(reviewSystem), true);
  });

  it("rejects no-code requests missing agent handoff fields", () => {
    for (const field of noCodeInstructionFields) {
      const invalidRequest: Record<string, unknown> = {
        ...reviewSystem.noCodeRequests[0],
      };
      delete invalidRequest[field];

      assert.equal(
        isCodeReviewShape({
          ...reviewSystem,
          noCodeRequests: [invalidRequest],
        }),
        false,
        field,
      );
    }
  });
});

function assertUnique(values: string[]) {
  assert.equal(new Set(values).size, values.length);
}
