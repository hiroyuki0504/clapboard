import { ArrowRight, GitPullRequest } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export function CommandHeader({
  dateLabel,
  blockerCount,
  connected,
}: {
  dateLabel: string;
  blockerCount: number;
  connected: boolean;
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
