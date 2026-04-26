import { ClipboardList, Layers3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AgentRunbook,
  AgentRunbookAgent,
} from "@/lib/code-review-system";

export function AgentRunbookCard({ runbook }: { runbook: AgentRunbook }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Layers3 className="h-4 w-4" aria-hidden />
          <CardTitle>{runbook.title}</CardTitle>
        </div>
        <Badge tone="green">{runbook.agents.length} agents</Badge>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b border-[#d8d1c4] px-4 py-3">
          <p className="text-sm leading-6 text-[#70675b]">{runbook.summary}</p>
        </div>
        <div className="divide-y divide-dashed divide-[#d8d1c4]">
          {runbook.agents.map((agent, index) => (
            <article key={agent.id} className="px-4 py-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={agent.layer === "L3" ? "purple" : "blue"}>
                      {agent.layer}
                    </Badge>
                    <Badge tone="slate">{agent.hierarchy}</Badge>
                  </div>
                  <h3 className="mt-3 font-black tracking-normal text-[#312d27]">
                    {index + 1}. {agent.name}
                  </h3>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
                    reports to: {agent.reportsTo}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-bold text-[#625a50]">
                  <ClipboardList className="h-4 w-4" aria-hidden />
                  コピー用ブロック
                </div>
              </div>

              <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-[#d8d1c4] bg-[#221d38] p-4 text-xs leading-6 text-[#f6f1e7]">
                <code>{buildAgentExecutionBlock(agent, index + 1)}</code>
              </pre>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function buildAgentExecutionBlock(agent: AgentRunbookAgent, index: number) {
  return [
    `# Agent ${index}: ${agent.name}`,
    `階層: ${agent.layer} / ${agent.hierarchy}`,
    `報告先: ${agent.reportsTo}`,
    "",
    formatBlockSection("目的", agent.purpose),
    formatBlockSection("担当範囲", agent.responsibilityScope),
    formatBlockSection("実装成果物", agent.implementationArtifacts),
    formatBlockSection("検証", agent.verification),
    formatBlockSection("PR条件", agent.pullRequestConditions),
  ].join("\n");
}

function formatBlockSection(title: string, items: string[]) {
  return [`${title}:`, ...items.map((item) => `- ${item}`)].join("\n");
}
