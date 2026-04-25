import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { reviewSystem } from "../lib/code-review-system";

const authorRequiredPriorities = new Set(["crucial", "high"]);

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
});

function assertUnique(values: string[]) {
  assert.equal(new Set(values).size, values.length);
}
