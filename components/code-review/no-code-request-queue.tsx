import { PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { noCodeRequestStatusMeta } from "@/lib/code-review-meta";
import type { NoCodeDevRequest } from "@/lib/code-review-system";

export function NoCodeRequestQueue({
  requests,
}: {
  requests: NoCodeDevRequest[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PlayCircle className="h-4 w-4" aria-hidden />
          <CardTitle>ノーコード依頼キュー</CardTitle>
        </div>
        <Badge tone="green">terminal free</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {requests.map((request) => {
          const status = noCodeRequestStatusMeta[request.status];
          const instructionFields = [
            ["スコープ", request.scope],
            ["期待成果", request.expectedOutcome],
            ["除外範囲", request.excludedScope],
            ["推奨ブランチ", request.recommendedBranch],
          ];

          return (
            <section
              key={request.id}
              className="border-b border-dashed border-[#d8d1c4] pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={status.tone}>{status.label}</Badge>
                <span className="font-mono text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
                  {request.source}
                </span>
              </div>
              <h3 className="mt-2 font-black tracking-normal text-[#312d27]">
                {request.title}
              </h3>
              <p className="mt-1 text-xs text-[#81786d]">
                {request.requester} ・ {request.targetRepository}
              </p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {instructionFields.map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-md border border-[#d8d1c4] bg-[#fffefa] p-3"
                  >
                    <dt className="text-[11px] font-bold text-[#81786d]">
                      {label}
                    </dt>
                    <dd
                      className={
                        label === "推奨ブランチ"
                          ? "mt-1 font-mono text-xs text-[#312d27]"
                          : "mt-1 text-xs leading-5 text-[#5f574d]"
                      }
                    >
                      {value}
                    </dd>
                  </div>
                ))}
                <div className="rounded-md border border-[#d8d1c4] bg-[#fffefa] p-3 sm:col-span-2">
                  <dt className="text-[11px] font-bold text-[#81786d]">
                    検証コマンド
                  </dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {request.verificationCommands.map((command) => (
                      <code
                        key={command}
                        className="rounded border border-[#d8d1c4] bg-[#f3f0e7] px-2 py-1 font-mono text-[11px] text-[#312d27]"
                      >
                        {command}
                      </code>
                    ))}
                  </dd>
                </div>
              </dl>
              <div className="mt-3 rounded-md border border-[#d8d1c4] bg-[#f8f5ec] p-3">
                <p className="text-[11px] font-bold text-[#81786d]">
                  AI投入プロンプト
                </p>
                <p className="mt-1 text-xs leading-5 text-[#5f574d]">
                  {request.agentPrompt}
                </p>
              </div>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
