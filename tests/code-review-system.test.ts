import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAuthorRequiredOpenComments,
  getPmDecisionComments,
  getPullRequestMergeGateSummary,
  isAuthorRequiredPriority,
} from "../lib/code-review-meta";
import { reviewSystem } from "../lib/code-review-system";

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
    assertUnique(reviewSystem.agentRunbook.agents.map((agent) => agent.id));
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
      const hasAuthorRequiredOpenComment =
        getAuthorRequiredOpenComments(pullRequest).length > 0;

      if (hasAuthorRequiredOpenComment) {
        assert.equal(pullRequest.gate, "blocked", pullRequest.id);
      }
    }
  });

  it("keeps review state and merge gates aligned", () => {
    for (const pullRequest of reviewSystem.pullRequests) {
      const authorRequiredOpenComments =
        getAuthorRequiredOpenComments(pullRequest);

      if (authorRequiredOpenComments.length > 0) {
        assert.equal(pullRequest.gate, "blocked", pullRequest.id);
        assert.notEqual(pullRequest.reviewState, "passed", pullRequest.id);
      }

      if (pullRequest.gate === "ready") {
        assert.equal(pullRequest.reviewState, "passed", pullRequest.id);
        assert.equal(authorRequiredOpenComments.length, 0, pullRequest.id);
      }

      if (pullRequest.reviewState === "passed") {
        assert.equal(pullRequest.gate, "ready", pullRequest.id);
      }
    }
  });

  it("builds merge gate summaries from the same blocker rules", () => {
    for (const pullRequest of reviewSystem.pullRequests) {
      const summary = getPullRequestMergeGateSummary(pullRequest);

      if (pullRequest.gate === "blocked") {
        assert.equal(summary.label, "マージ不可", pullRequest.id);
        assert.equal(summary.reasonLabel, "block理由", pullRequest.id);
      }

      if (pullRequest.gate === "ready") {
        assert.equal(summary.label, "マージ可", pullRequest.id);
        assert.equal(summary.reasonLabel, "ready理由", pullRequest.id);
      }
    }
  });

  it("separates PM decision comments from author-required open blockers", () => {
    for (const pullRequest of reviewSystem.pullRequests) {
      const pmDecisionComments = getPmDecisionComments(pullRequest);

      for (const comment of pmDecisionComments) {
        assert.ok(
          !isAuthorRequiredPriority(comment.priority) ||
            comment.status === "accepted-risk",
          `${pullRequest.id}:${comment.id}`,
        );
      }

      assert.equal(
        pmDecisionComments.some(
          (comment) =>
            comment.status === "open" &&
            isAuthorRequiredPriority(comment.priority),
        ),
        false,
        pullRequest.id,
      );
    }
  });

  it("keeps the PM runbook copy-ready for four agents", () => {
    const agents = reviewSystem.agentRunbook.agents;

    assert.equal(agents.length, 4);
    assert.deepEqual(
      agents.map((agent) => [agent.layer, agent.name]),
      [
        ["L1", "PM管制エージェント"],
        ["L2", "実装エージェント"],
        ["L2", "レビューエージェント"],
        ["L3", "マージ判定エージェント"],
      ],
    );

    for (const agent of agents) {
      assertRequiredItems(agent.name, "purpose", agent.purpose);
      assertRequiredItems(
        agent.name,
        "responsibilityScope",
        agent.responsibilityScope,
      );
      assertRequiredItems(
        agent.name,
        "implementationArtifacts",
        agent.implementationArtifacts,
      );
      assertRequiredItems(agent.name, "verification", agent.verification);
      assertRequiredItems(
        agent.name,
        "pullRequestConditions",
        agent.pullRequestConditions,
      );
    }
  });
});

function assertUnique(values: string[]) {
  assert.equal(new Set(values).size, values.length);
}

function assertRequiredItems(
  agentName: string,
  fieldName: string,
  values: string[],
) {
  assert.ok(values.length > 0, `${agentName}.${fieldName}`);
  assert.ok(
    values.every((value) => value.trim().length > 0),
    `${agentName}.${fieldName}`,
  );
}
