import { GitPullRequest, MousePointerClick } from "lucide-react";
import { AgentRunbookCard } from "@/components/code-review/agent-runbook-card";
import { AgentWorktreesCard } from "@/components/code-review/agent-worktrees-card";
import { BranchTableCard } from "@/components/code-review/branch-table-card";
import { CodeReviewHeader } from "@/components/code-review/header-section";
import { HackathonIntakeDemo } from "@/components/code-review/hackathon-intake-demo";
import { NoCodeRequestQueue } from "@/components/code-review/no-code-request-queue";
import { OAuthRunnerCard } from "@/components/code-review/oauth-runner-card";
import { PipelineStepsCard } from "@/components/code-review/pipeline-steps-card";
import { PolicyListCard } from "@/components/code-review/policy-list-card";
import { PriorityLevelTable } from "@/components/code-review/priority-level-table";
import { PullRequestQueue } from "@/components/code-review/pull-request-queue";
import { Badge } from "@/components/ui/badge";
import { getCodeReviewSystem } from "@/lib/clapboard-api";
import { isActiveAgentWorktreeStatus, isAuthorRequiredPriority } from "@/lib/code-review-meta";

export const dynamic = "force-dynamic";

export default async function CodeReviewPage() {
  const reviewSystemResult = await getCodeReviewSystem();
  if (reviewSystemResult.error) {
    throw new Error(reviewSystemResult.error.message);
  }

  const reviewSystem = reviewSystemResult.data;
  const activeBranches = reviewSystem.branches.length;
  const activeAgentWorktrees = reviewSystem.agentWorktrees.filter(
    (worktree) => isActiveAgentWorktreeStatus(worktree.status),
  ).length;
  const readyNoCodeRequests = reviewSystem.noCodeRequests.filter(
    (request) => request.status === "ready",
  ).length;
  const queuedReviews = reviewSystem.pullRequests.filter(
    (pullRequest) => pullRequest.reviewState === "queued",
  ).length;
  const unresolvedReviews = reviewSystem.pullRequests.filter(
    (pullRequest) => pullRequest.reviewState !== "passed",
  ).length;
  const authorBlockingComments = reviewSystem.pullRequests.reduce(
    (total, pullRequest) =>
      total +
      pullRequest.comments.filter(
        (comment) =>
          comment.status === "open" && isAuthorRequiredPriority(comment.priority),
      ).length,
    0,
  );

  return (
    <div className="space-y-4">
      <CodeReviewHeader
        reviewModel={reviewSystem.reviewModel}
        pmOwner={reviewSystem.pmOwner}
        mainBranch={reviewSystem.mainBranch}
        activeBranches={activeBranches}
        activeAgentWorktrees={activeAgentWorktrees}
        authorBlockingComments={authorBlockingComments}
      />

      <HackathonIntakeDemo />

      <section className="space-y-3">
        <div className="flex flex-col gap-2 rounded-lg border border-[#423c33]/55 bg-[#f3f0e7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <MousePointerClick className="h-4 w-4" aria-hidden />
            <h2 className="text-sm font-bold tracking-normal text-[#312d27]">
              AIワークツリー管制
            </h2>
          </div>
          <Badge tone="purple">
            Webワークツリー {activeAgentWorktrees}件 / 投入可 {readyNoCodeRequests}件
          </Badge>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <AgentWorktreesCard worktrees={reviewSystem.agentWorktrees} />
          <NoCodeRequestQueue requests={reviewSystem.noCodeRequests} />
        </div>
      </section>

      <AgentRunbookCard runbook={reviewSystem.agentRunbook} />

      <PriorityLevelTable levels={reviewSystem.priorityLevels} />

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <PolicyListCard policies={reviewSystem.policies} />
        <PipelineStepsCard
          steps={reviewSystem.pipeline}
          reviewModel={reviewSystem.reviewModel}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <BranchTableCard branches={reviewSystem.branches} />
        <OAuthRunnerCard
          reviewModel={reviewSystem.reviewModel}
          codexReviewCommand={reviewSystem.codexReviewCommand}
          checklist={reviewSystem.checklist}
        />
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 rounded-lg border border-[#423c33]/55 bg-[#f3f0e7] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="h-4 w-4" aria-hidden />
            <h2 className="text-sm font-bold tracking-normal text-[#312d27]">
              PRレビューキュー
            </h2>
          </div>
          <Badge tone="amber">
            未解決 {unresolvedReviews}件 / 投入待ち {queuedReviews}件
          </Badge>
        </div>
        <PullRequestQueue pullRequests={reviewSystem.pullRequests} />
      </section>
    </div>
  );
}
