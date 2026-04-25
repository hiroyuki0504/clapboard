import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  GitBranch,
  GitMerge,
  GitPullRequest,
  LockKeyhole,
  ShieldCheck,
  SquareTerminal,
  UserCheck,
} from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCodeReviewSystem } from "@/lib/clapboard-api";
import {
  type BranchWorkstreamStatus,
  type ReviewCommentStatus,
  type MergeGate,
  type ReviewPriority,
  type ReviewState,
} from "@/lib/code-review-system";
import { cn, formatDateTime } from "@/lib/utils";

const branchStatusMeta: Record<
  BranchWorkstreamStatus,
  { label: string; tone: BadgeTone }
> = {
  design: { label: "設計中", tone: "purple" },
  implementing: { label: "実装中", tone: "blue" },
  "review-ready": { label: "レビュー待ち", tone: "amber" },
  "changes-requested": { label: "修正依頼", tone: "red" },
  approved: { label: "承認済み", tone: "green" },
};

const reviewStateMeta: Record<
  ReviewState,
  { label: string; tone: BadgeTone }
> = {
  queued: { label: "投入待ち", tone: "amber" },
  running: { label: "レビュー中", tone: "blue" },
  "needs-fix": { label: "修正必要", tone: "red" },
  passed: { label: "通過", tone: "green" },
};

const mergeGateMeta: Record<
  MergeGate,
  { label: string; tone: BadgeTone }
> = {
  open: { label: "確認中", tone: "blue" },
  blocked: { label: "ブロック", tone: "red" },
  ready: { label: "マージ可", tone: "green" },
};

const riskMeta = {
  low: { label: "低", className: "text-[#426c3d]" },
  medium: { label: "中", className: "text-[#7c5a18]" },
  high: { label: "高", className: "text-[#9f452c]" },
};

const priorityMeta: Record<
  ReviewPriority,
  { rank: 1 | 2 | 3 | 4; label: string; tone: BadgeTone }
> = {
  crucial: { rank: 1, label: "Crucial", tone: "red" },
  high: { rank: 2, label: "High Priority", tone: "amber" },
  medium: { rank: 3, label: "Medium", tone: "blue" },
  low: { rank: 4, label: "Low", tone: "slate" },
};

const commentStatusMeta: Record<
  ReviewCommentStatus,
  { label: string; tone: BadgeTone }
> = {
  open: { label: "未対応", tone: "red" },
  fixed: { label: "対応済み", tone: "green" },
  "accepted-risk": { label: "PM保留", tone: "amber" },
};

const pipelineIcons = [UserCheck, GitBranch, GitPullRequest, Bot, GitMerge];

export const dynamic = "force-dynamic";

function isAuthorRequiredPriority(priority: ReviewPriority) {
  return priority === "crucial" || priority === "high";
}

export default async function CodeReviewPage() {
  const reviewSystemResult = await getCodeReviewSystem();
  if (reviewSystemResult.error) {
    throw new Error(reviewSystemResult.error.message);
  }

  const reviewSystem = reviewSystemResult.data;
  const activeBranches = reviewSystem.branches.length;
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
      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            CODE REVIEW CONTROL ・ PM MAIN GATE
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                mainをPMが守るブランチ/PRレビュー管制
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                作業ブランチを目的別に分け、PR作成時にCodex {reviewSystem.reviewModel}
                レビューを投入し、PM承認までの状態を追跡します。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-md border border-[#a8c3a6] bg-[#edf5ea] px-3 py-2 text-sm font-bold text-[#426c3d]">
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {reviewSystem.pmOwner}
              </div>
              <Badge tone={reviewSystemResult.connected ? "green" : "amber"}>
                {reviewSystemResult.connected ? "Backend API" : "Local API"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MetricTile label="main" value={reviewSystem.mainBranch} icon={LockKeyhole} />
          <MetricTile label="作業ブランチ" value={`${activeBranches}`} icon={GitBranch} />
          <MetricTile label="未解決PR" value={`${unresolvedReviews}`} icon={Bot} />
          <MetricTile label="High以上未対応" value={`${authorBlockingComments}`} icon={AlertTriangle} />
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden />
            <CardTitle>レビュー返信プライオリティ</CardTitle>
          </div>
          <Badge tone="red">1-2は作成者必須</Badge>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px]">
            <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
              <tr>
                <th className="px-5 py-4">順位</th>
                <th className="px-5 py-4">優先度</th>
                <th className="px-5 py-4">対応者</th>
                <th className="px-5 py-4">マージ判断</th>
                <th className="px-5 py-4">基準</th>
              </tr>
            </thead>
            <tbody>
              {reviewSystem.priorityLevels.map((level) => {
                const priority = priorityMeta[level.priority];
                return (
                  <tr key={level.priority}>
                    <td className="border-t border-[#ded6ca] px-5 py-4 font-mono text-sm font-black text-[#312d27]">
                      {level.rank}
                    </td>
                    <td className="border-t border-[#ded6ca] px-5 py-4">
                      <Badge tone={priority.tone}>{level.label}</Badge>
                    </td>
                    <td className="border-t border-[#ded6ca] px-5 py-4 text-sm font-bold text-[#312d27]">
                      {level.owner}
                    </td>
                    <td className="border-t border-[#ded6ca] px-5 py-4 text-sm text-[#70675b]">
                      {level.mergeRule}
                    </td>
                    <td className="border-t border-[#ded6ca] px-5 py-4 text-sm leading-6 text-[#70675b]">
                      {level.body}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <CardTitle>運用ルール案</CardTitle>
            </div>
            <Badge tone="green">PM gate</Badge>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {reviewSystem.policies.map((policy) => (
              <div
                key={policy.id}
                className="grid gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 last:border-b-0 sm:grid-cols-[160px_1fr]"
              >
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
                    {policy.value}
                  </p>
                  <p className="mt-1 font-bold text-[#312d27]">{policy.title}</p>
                </div>
                <p className="text-sm leading-6 text-[#70675b]">{policy.body}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitMerge className="h-4 w-4" aria-hidden />
              <CardTitle>レビュー投入フロー</CardTitle>
            </div>
            <Badge tone="purple">{reviewSystem.reviewModel}</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-5">
              {reviewSystem.pipeline.map((step, index) => {
                const Icon = pipelineIcons[index] ?? CheckCircle2;
                return (
                  <div key={step.id} className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d8d1c4] bg-[#fbfaf5] text-[#c95d3a]">
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                      {index < reviewSystem.pipeline.length - 1 && (
                        <ArrowRight
                          className="hidden h-4 w-4 text-[#9a9084] md:block"
                          aria-hidden
                        />
                      )}
                    </div>
                    <p className="mt-3 text-sm font-bold text-[#312d27]">{step.title}</p>
                    <p className="mt-2 text-xs leading-5 text-[#70675b]">{step.body}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" aria-hidden />
              <CardTitle>ブランチ分割ボード</CardTitle>
            </div>
            <span className="font-mono text-xs text-[#81786d]">base: main</span>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                <tr>
                  <th className="px-5 py-4">作業</th>
                  <th className="px-5 py-4">ブランチ</th>
                  <th className="px-5 py-4">状態</th>
                  <th className="px-5 py-4">PR</th>
                  <th className="px-5 py-4">リスク</th>
                  <th className="px-5 py-4">次アクション</th>
                </tr>
              </thead>
              <tbody>
                {reviewSystem.branches.map((branch) => {
                  const status = branchStatusMeta[branch.status];
                  const risk = riskMeta[branch.risk];
                  return (
                    <tr key={branch.id}>
                      <td className="border-t border-[#ded6ca] px-5 py-4">
                        <p className="font-bold text-[#312d27]">{branch.title}</p>
                        <p className="mt-1 text-xs text-[#81786d]">
                          {branch.owner} ・ 期限 {formatDateTime(branch.dueAt)}
                        </p>
                      </td>
                      <td className="border-t border-[#ded6ca] px-5 py-4 font-mono text-xs text-[#5f574d]">
                        {branch.branch}
                      </td>
                      <td className="border-t border-[#ded6ca] px-5 py-4">
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </td>
                      <td className="border-t border-[#ded6ca] px-5 py-4 text-sm font-bold text-[#312d27]">
                        {branch.pullRequest}
                      </td>
                      <td className="border-t border-[#ded6ca] px-5 py-4">
                        <span className={cn("font-bold", risk.className)}>
                          {risk.label}
                        </span>
                      </td>
                      <td className="border-t border-[#ded6ca] px-5 py-4 text-sm leading-6 text-[#70675b]">
                        {branch.nextAction}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SquareTerminal className="h-4 w-4" aria-hidden />
              <CardTitle>Codexレビューコマンド</CardTitle>
            </div>
            <Badge tone="slate">local CLI</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-[#70675b]">
              PRブランチ上で以下を実行すると、mainとの差分を
              {reviewSystem.reviewModel}でレビューします。
            </p>
            <pre className="mt-4 overflow-x-auto rounded-md border border-[#d8d1c4] bg-[#221d38] p-4 text-xs leading-6 text-[#f6f1e7]">
              <code>{reviewSystem.codexReviewCommand}</code>
            </pre>
            <div className="mt-4 space-y-2 text-sm text-[#5f574d]">
              {reviewSystem.checklist.map((item) => (
                <div key={item} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#5f8b5b]" aria-hidden />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
        <div className="grid gap-3 lg:grid-cols-3">
          {reviewSystem.pullRequests.map((pullRequest) => {
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
              <section
                key={pullRequest.id}
                className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4"
              >
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
          })}
        </div>
      </section>
    </div>
  );
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#d8d1c4] bg-[#fbfaf5] text-[#c95d3a]">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
        {label}
      </p>
      <p className="mt-1 font-mono text-xl font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}
