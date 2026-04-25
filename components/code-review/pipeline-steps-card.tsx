import {
  ArrowRight,
  Bot,
  CheckCircle2,
  GitBranch,
  GitMerge,
  GitPullRequest,
  UserCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PipelineStep = {
  id: string;
  title: string;
  body: string;
};

const pipelineIcons = [UserCheck, GitBranch, GitPullRequest, Bot, GitMerge];

export function PipelineStepsCard({
  steps,
  reviewModel,
}: {
  steps: PipelineStep[];
  reviewModel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitMerge className="h-4 w-4" aria-hidden />
          <CardTitle>ノーコード開発フロー</CardTitle>
        </div>
        <Badge tone="purple">{reviewModel}</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-5">
          {steps.map((step, index) => {
            const Icon = pipelineIcons[index] ?? CheckCircle2;
            return (
              <div key={step.id} className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#d8d1c4] bg-[#fbfaf5] text-[#c95d3a]">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  {index < steps.length - 1 && (
                    <ArrowRight
                      className="hidden h-4 w-4 text-[#9a9084] md:block"
                      aria-hidden
                    />
                  )}
                </div>
                <p className="mt-3 text-sm font-bold text-[#312d27]">
                  {step.title}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#70675b]">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
