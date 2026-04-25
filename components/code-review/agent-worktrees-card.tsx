import { Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  agentWorktreeModeMeta,
  agentWorktreeStatusMeta,
} from "@/lib/code-review-meta";
import type { AgentWorktree } from "@/lib/code-review-system";
import { formatDateTime } from "@/lib/utils";

export function AgentWorktreesCard({
  worktrees,
}: {
  worktrees: AgentWorktree[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4" aria-hidden />
          <CardTitle>Webワークツリー</CardTitle>
        </div>
        <Badge tone="blue">GitHub worktree</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-dashed divide-[#d8d1c4]">
          {worktrees.map((worktree) => {
            const status = agentWorktreeStatusMeta[worktree.status];
            return (
              <article key={worktree.id} className="px-4 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={status.tone}>{status.label}</Badge>
                      <Badge tone="slate">
                        {agentWorktreeModeMeta[worktree.mode]}
                      </Badge>
                    </div>
                    <h3 className="mt-3 font-black tracking-normal text-[#312d27]">
                      {worktree.title}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-[#81786d]">
                      {worktree.repository} ・ {worktree.branch} {"->"}{" "}
                      {worktree.base}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <a
                      className="inline-flex h-9 items-center justify-center rounded-md border border-[#bfb6a8] bg-[#fffefa] px-3 text-xs font-bold text-[#312d27] hover:border-[#8f8678] hover:bg-[#f6f1e7]"
                      href={worktree.previewUrl}
                    >
                      プレビュー
                    </a>
                    <span className="inline-flex h-9 items-center justify-center rounded-md border border-[#c8c0b3] bg-[#f7f3ea] px-3 text-xs font-bold text-[#625a50]">
                      {worktree.pullRequest}
                    </span>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <WorktreeStep label="Current" value={worktree.currentStep} />
                  <WorktreeStep label="Next" value={worktree.nextAction} />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
                      Human
                    </p>
                    <p className="mt-1 text-sm font-bold leading-6 text-[#312d27]">
                      {worktree.humanAction}
                    </p>
                    <p className="mt-1 text-xs text-[#81786d]">
                      {formatDateTime(worktree.updatedAt)}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function WorktreeStep({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-[#70675b]">{value}</p>
    </div>
  );
}
