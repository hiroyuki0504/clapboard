import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  commentStatusMeta,
  getAuthorRequiredOpenComments,
  getPmDecisionComments,
  getPullRequestMergeGateSummary,
  getResidualRiskSummary,
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
  const gateSummary = getPullRequestMergeGateSummary(pullRequest);
  const authorRequiredOpenComments =
    getAuthorRequiredOpenComments(pullRequest);
  const authorRequiredOpenCount = authorRequiredOpenComments.length;
  const pmDecisionComments = getPmDecisionComments(pullRequest);
  const residualRiskSummary = getResidualRiskSummary(pullRequest);
  const pmDecisionPoint =
    pmDecisionComments.length > 0
      ? `${pmDecisionComments.length}件を後続調整として許容するか確認。`
      : "追加のPM判断なし。";
  const sortedComments = [...pullRequest.comments].sort(
    (a, b) => priorityMeta[a.priority].rank - priorityMeta[b.priority].rank,
  );
  const cardClassName =
    pullRequest.gate === "blocked"
      ? "border-[#d69783] bg-[#fff4ee]"
      : pullRequest.gate === "ready"
        ? "border-[#a8c3a6] bg-[#f7fbf4]"
        : "border-[#d8d1c4] bg-[#fbfaf5]";
  const gateBandClassName =
    pullRequest.gate === "blocked"
      ? "border-[#c86546] bg-[#fff8f4]"
      : pullRequest.gate === "ready"
        ? "border-[#72a46d] bg-[#f5fbf1]"
        : "border-[#6e92b3] bg-[#f4f8fb]";

  return (
    <section className={`rounded-md border p-4 ${cardClassName}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
            {pullRequest.id} ・ {pullRequest.changedFiles} files
          </p>
          <h3 className="mt-1 font-black tracking-normal text-[#312d27]">
            {pullRequest.title}
          </h3>
        </div>
        <Badge tone={gate.tone}>merge gate: {gate.label}</Badge>
      </div>
      <div className="space-y-2 text-sm text-[#70675b]">
        <p className="font-mono text-xs text-[#5f574d]">
          {pullRequest.branch} → {pullRequest.base}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Clock3 className="h-4 w-4 text-[#8b8175]" aria-hidden />
          <Badge tone={reviewState.tone}>review: {reviewState.label}</Badge>
          <Badge tone={authorRequiredOpenCount > 0 ? "red" : "green"}>
            author-required open comments: {authorRequiredOpenCount}
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
      <div className={`mt-3 border-l-4 px-3 py-2 ${gateBandClassName}`}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#5f574d]">
            merge gate
          </p>
          <Badge tone={gateSummary.tone}>{gateSummary.label}</Badge>
        </div>
        <p className="mt-2 text-sm font-bold leading-6 text-[#312d27]">
          {gateSummary.reasonLabel}: {gateSummary.reason}
        </p>
      </div>
      <div className="mt-4 space-y-2 border-t border-dashed border-[#d8d1c4] pt-4 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#81786d]">
            PM判断コメント
          </p>
          <Badge tone={pmDecisionComments.length > 0 ? "amber" : "green"}>
            {pmDecisionComments.length}件
          </Badge>
        </div>
        {pmDecisionComments.length > 0 ? (
          <ul className="space-y-2">
            {pmDecisionComments.map((comment) => {
              const priority = priorityMeta[comment.priority];
              const status = commentStatusMeta[comment.status];
              return (
                <li key={comment.id} className="leading-5 text-[#5f574d]">
                  <span className="font-bold text-[#312d27]">
                    {priority.label} / {status.label}:
                  </span>{" "}
                  {comment.title}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="leading-5 text-[#5f574d]">
            PM判断で持ち越すコメントはありません。
          </p>
        )}
        {pullRequest.gate === "ready" ? (
          <div className="space-y-1 pt-1 text-xs leading-5 text-[#5f574d]">
            <p>
              <span className="font-bold text-[#312d27]">残リスク:</span>{" "}
              {residualRiskSummary}
            </p>
            <p>
              <span className="font-bold text-[#312d27]">PM判断ポイント:</span>{" "}
              {pmDecisionPoint}
            </p>
          </div>
        ) : null}
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
