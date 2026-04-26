import type { BadgeTone } from "@/components/ui/badge";
import type {
  AgentWorktreeMode,
  AgentWorktreeStatus,
  BranchWorkstreamStatus,
  MergeGate,
  NoCodeRequestStatus,
  PullRequestReview,
  ReviewCommentStatus,
  ReviewPriority,
  ReviewState,
} from "@/lib/code-review-system";

export const branchStatusMeta: Record<
  BranchWorkstreamStatus,
  { label: string; tone: BadgeTone }
> = {
  design: { label: "設計中", tone: "purple" },
  implementing: { label: "実装中", tone: "blue" },
  "review-ready": { label: "レビュー待ち", tone: "amber" },
  "changes-requested": { label: "修正依頼", tone: "red" },
  approved: { label: "承認済み", tone: "green" },
};

export const reviewStateMeta: Record<
  ReviewState,
  { label: string; tone: BadgeTone }
> = {
  queued: { label: "投入待ち", tone: "amber" },
  running: { label: "レビュー中", tone: "blue" },
  "needs-fix": { label: "修正必要", tone: "red" },
  passed: { label: "通過", tone: "green" },
};

export const mergeGateMeta: Record<
  MergeGate,
  { label: string; tone: BadgeTone }
> = {
  open: { label: "確認中", tone: "blue" },
  blocked: { label: "ブロック", tone: "red" },
  ready: { label: "マージ可", tone: "green" },
};

export const agentWorktreeStatusMeta: Record<
  AgentWorktreeStatus,
  { label: string; tone: BadgeTone }
> = {
  queued: { label: "投入待ち", tone: "amber" },
  building: { label: "AI作業中", tone: "blue" },
  "preview-ready": { label: "プレビュー可", tone: "purple" },
  "pr-ready": { label: "PR準備完了", tone: "green" },
};

export const agentWorktreeModeMeta: Record<AgentWorktreeMode, string> = {
  "prompt-to-branch": "Prompt -> Branch",
  "issue-to-pr": "Issue -> PR",
  "design-to-ui": "Design -> UI",
};

export const noCodeRequestStatusMeta: Record<
  NoCodeRequestStatus,
  { label: string; tone: BadgeTone }
> = {
  intake: { label: "受付", tone: "slate" },
  scoped: { label: "範囲確定", tone: "purple" },
  building: { label: "AI作業中", tone: "blue" },
  ready: { label: "投入可", tone: "green" },
};

export const riskMeta = {
  low: { label: "低", className: "text-[#426c3d]" },
  medium: { label: "中", className: "text-[#7c5a18]" },
  high: { label: "高", className: "text-[#9f452c]" },
};

export const priorityMeta: Record<
  ReviewPriority,
  { rank: 1 | 2 | 3 | 4; label: string; tone: BadgeTone }
> = {
  crucial: { rank: 1, label: "Crucial", tone: "red" },
  high: { rank: 2, label: "High Priority", tone: "amber" },
  medium: { rank: 3, label: "Medium", tone: "blue" },
  low: { rank: 4, label: "Low", tone: "slate" },
};

export const commentStatusMeta: Record<
  ReviewCommentStatus,
  { label: string; tone: BadgeTone }
> = {
  open: { label: "未対応", tone: "red" },
  fixed: { label: "対応済み", tone: "green" },
  "accepted-risk": { label: "PM保留", tone: "amber" },
};

export function isAuthorRequiredPriority(priority: ReviewPriority) {
  return priority === "crucial" || priority === "high";
}

export function getAuthorRequiredOpenComments(
  pullRequest: Pick<PullRequestReview, "comments">,
) {
  return pullRequest.comments.filter(
    (comment) =>
      comment.status === "open" && isAuthorRequiredPriority(comment.priority),
  );
}

export function getPmDecisionComments(
  pullRequest: Pick<PullRequestReview, "comments">,
) {
  return pullRequest.comments.filter(
    (comment) =>
      !isAuthorRequiredPriority(comment.priority) ||
      comment.status === "accepted-risk",
  );
}

export function getPullRequestMergeGateSummary(
  pullRequest: Pick<
    PullRequestReview,
    "comments" | "gate" | "reviewState"
  >,
) {
  const authorRequiredOpenComments =
    getAuthorRequiredOpenComments(pullRequest);

  if (pullRequest.gate === "blocked" || authorRequiredOpenComments.length > 0) {
    return {
      label: "マージ不可",
      reasonLabel: "block理由",
      reason:
        authorRequiredOpenComments.length > 0
          ? `${authorRequiredOpenComments.length}件のCrucial/Highが未対応。PR作成者の修正完了までPM承認しない。`
          : "レビュー状態が修正必要。PR作成者の対応完了までPM承認しない。",
      tone: "red" as const,
    };
  }

  if (pullRequest.gate === "ready") {
    return {
      label: "マージ可",
      reasonLabel: "ready理由",
      reason:
        pullRequest.reviewState === "passed"
          ? "レビュー通過済みでCrucial/Highの未対応なし。残リスクをPMが許容できればマージ可。"
          : "Crucial/Highの未対応なし。PMが最終確認する。",
      tone: "green" as const,
    };
  }

  return {
    label: "PM確認中",
    reasonLabel: "確認理由",
    reason: "レビュー投入またはPM承認待ち。Crucial/Highが出たらマージ不可。",
    tone: "blue" as const,
  };
}

export function getResidualRiskSummary(
  pullRequest: Pick<PullRequestReview, "comments" | "riskAreas">,
) {
  const pmDecisionComments = getPmDecisionComments(pullRequest);

  if (pmDecisionComments.length > 0) {
    return pmDecisionComments.map((comment) => comment.title).join(" / ");
  }

  if (pullRequest.riskAreas.length > 0) {
    return `確認済み領域: ${pullRequest.riskAreas.join(" / ")}。追加保留なし。`;
  }

  return "PM判断で持ち越すコメントはありません。";
}

export function isActiveAgentWorktreeStatus(status: AgentWorktreeStatus) {
  return status !== "pr-ready";
}
