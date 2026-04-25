import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  commentStatusMeta,
  isAuthorRequiredPriority,
  mergeGateMeta,
  priorityMeta,
  reviewStateMeta,
} from "@/lib/code-review-meta";
import type { PullRequestReview } from "@/lib/code-review-system";

export function PullRequestQueue({
  pullRequests,
}: {
  pullRequests: PullRequestReview[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {pullRequests.map((pullRequest) => (
        <PullRequestCard key={pullRequest.id} pullRequest={pullRequest} />
      ))}
    </div>
  );
}

function PullRequestCard({
  pullRequest,
}: {
  pullRequest: PullRequestReview;
}) {
  const reviewState = reviewStateMeta[pullRequest.reviewState];
  const gate = mergeGateMeta[pullRequest.gate];
  const authorOpenComments = pullRequest.comments.filter(
    (comment) =>
      comment.status === "open" && isAuthorRequiredPriority(comment.priority),
  ).length;
  const sortedComments = [...pullRequest.comments].sort(
    (a, b) => priorityMeta[a.priority].rank - priorityMeta[b.priority].rank,
  );

  return (
    <section className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
            {pullRequest.id} ・ {pullRequest.changedFiles} files
          </p>
          <h3 className="mt-1 font-black tracking-normal text-[#312d27]">
            {pullRequest.title}
          </h3>
        </div>
        <Badge tone={gate.tone}>{gate.label}</Badge>
      </div>
      <div className="space-y-2 text-sm text-[#70675b]">
        <p className="font-mono text-xs text-[#5f574d]">
          {pullRequest.branch} → {pullRequest.base}
        </p>
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#8b8175]" aria-hidden />
          <Badge tone={reviewState.tone}>{reviewState.label}</Badge>
          <Badge tone={authorOpenComments > 0 ? "red" : "green"}>
            {authorOpenComments > 0
              ? `作成者対応 ${authorOpenComments}`
              : "作成者対応済み"}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {pullRequest.riskAreas.map((riskArea) => (
            <Badge key={riskArea} tone="slate">
              {riskArea}
            </Badge>
          ))}
        </div>
      </div>
      <div className="mt-4 space-y-3 border-t border-dashed border-[#d8d1c4] pt-4">
        {sortedComments.map((comment) => {
          const priority = priorityMeta[comment.priority];
          const status = commentStatusMeta[comment.status];
          return (
            <div key={comment.id}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge tone={priority.tone}>
                  {priority.rank}. {priority.label}
                </Badge>
                <Badge tone={status.tone}>{status.label}</Badge>
              </div>
              <p className="text-sm font-bold text-[#312d27]">
                {comment.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-[#70675b]">
                {comment.body}
              </p>
            </div>
          );
        })}
      </div>
      <pre className="mt-4 overflow-x-auto rounded-md border border-[#d8d1c4] bg-[#fffefa] p-3 font-mono text-[11px] leading-5 text-[#5f574d]">
        <code>{pullRequest.codexCommand}</code>
      </pre>
    </section>
  );
}
