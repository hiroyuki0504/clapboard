import {
  AlertTriangle,
  GitBranch,
  LockKeyhole,
  MousePointerClick,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MetricTile } from "./metric-tile";

export function CodeReviewHeader({
  reviewModel,
  pmOwner,
  connected,
  mainBranch,
  activeBranches,
  activeAgentWorktrees,
  authorBlockingComments,
}: {
  reviewModel: string;
  pmOwner: string;
  connected: boolean;
  mainBranch: string;
  activeBranches: number;
  activeAgentWorktrees: number;
  authorBlockingComments: number;
}) {
  return (
    <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
      <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
          AI WORKTREE CONTROL ・ NO-CODE DEV GATE
        </p>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
              WebワークツリーでAI開発をブラウザ管制
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
              自然言語やGitHub IssueをAI作業依頼に変換し、Webワークツリー、
              プレビュー、PR下書き、{reviewModel}のレビューをPM承認まで追跡します。
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-[#a8c3a6] bg-[#edf5ea] px-3 py-2 text-sm font-bold text-[#426c3d]">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {pmOwner}
            </div>
            <Badge tone={connected ? "green" : "amber"}>
              {connected ? "Backend API" : "Local API"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MetricTile label="main" value={mainBranch} icon={LockKeyhole} />
        <MetricTile
          label="Webワークツリー"
          value={`${activeAgentWorktrees}`}
          icon={MousePointerClick}
        />
        <MetricTile label="作業ブランチ" value={`${activeBranches}`} icon={GitBranch} />
        <MetricTile
          label="High以上未対応"
          value={`${authorBlockingComments}`}
          icon={AlertTriangle}
        />
      </div>
    </section>
  );
}
