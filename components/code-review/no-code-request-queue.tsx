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
              <p className="mt-3 text-sm leading-6 text-[#70675b]">
                {request.expectedOutcome}
              </p>
              <p className="mt-3 rounded-md border border-[#d8d1c4] bg-[#fffefa] p-3 text-xs leading-5 text-[#5f574d]">
                {request.agentPrompt}
              </p>
            </section>
          );
        })}
      </CardContent>
    </Card>
  );
}
