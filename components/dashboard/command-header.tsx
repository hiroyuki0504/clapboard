import { AlertTriangle, ArrowRight, GitPullRequest } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { projectDetailHref } from "@/lib/project-href";
import type { ProjectPrioritySignal } from "@/lib/project-selectors";

export function CommandHeader({
  dateLabel,
  blockerCount,
  connected,
  prioritySignal,
}: {
  dateLabel: string;
  blockerCount: number;
  connected: boolean;
  prioritySignal?: ProjectPrioritySignal;
}) {
  return (
    <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
        {dateLabel} ・ PROGRESS COMMAND
      </p>
      <div className="mt-2 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-black tracking-normal text-[#2f2b25] sm:text-2xl">
            今日進めるべきこと - ブロッカー{blockerCount}件
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
            ワークストリームごとの進捗率、次の節目、停滞タスク、更新ログを一画面で追跡します。
          </p>
          {prioritySignal && (
            <Link
              href={projectDetailHref(
                prioritySignal.projectId,
                prioritySignal.targetTab,
              )}
              className="mt-4 grid max-w-3xl grid-cols-[32px_1fr_auto] items-center gap-3 rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3 transition hover:border-[#c95d3a] hover:bg-[#fffefa]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f7e5dc] text-[#9a4a31]">
                <AlertTriangle className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#9a4a31]">
                  Next action
                </span>
                <span className="mt-1 block truncate text-sm font-bold text-[#312d27]">
                  {prioritySignal.projectName} - {prioritySignal.actionLabel}
                </span>
                <span className="mt-1 block truncate text-xs text-[#81786d]">
                  リスク: {prioritySignal.reasonLabels.slice(0, 3).join(" / ")}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#70675b]" aria-hidden />
            </Link>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge tone={connected ? "green" : "amber"}>
            {connected ? "Backend API" : "Local API"}
          </Badge>
          <ButtonLink href="/code-review">
            レビュー管制
            <GitPullRequest className="h-4 w-4" aria-hidden />
          </ButtonLink>
          <ButtonLink href="/projects" variant="secondary">
            進捗ボードへ
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
