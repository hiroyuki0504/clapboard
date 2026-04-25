import { CheckCircle2, SquareTerminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OAuthRunnerCard({
  reviewModel,
  codexReviewCommand,
  checklist,
}: {
  reviewModel: string;
  codexReviewCommand: string;
  checklist: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SquareTerminal className="h-4 w-4" aria-hidden />
          <CardTitle>OAuth runner コマンド</CardTitle>
        </div>
        <Badge tone="slate">local CLI</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-[#70675b]">
          WebワークツリーのPR候補に対して以下を実行すると、mainとの差分を
          ChatGPT/OAuthログイン済みの{reviewModel}でレビューします。
        </p>
        <pre className="mt-4 overflow-x-auto rounded-md border border-[#d8d1c4] bg-[#221d38] p-4 text-xs leading-6 text-[#f6f1e7]">
          <code>{codexReviewCommand}</code>
        </pre>
        <div className="mt-4 space-y-2 text-sm text-[#5f574d]">
          {checklist.map((item) => (
            <div key={item} className="flex gap-2">
              <CheckCircle2
                className="mt-0.5 h-4 w-4 shrink-0 text-[#5f8b5b]"
                aria-hidden
              />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
