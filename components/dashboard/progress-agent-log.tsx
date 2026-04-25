import { SquareTerminal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLogTime } from "@/lib/utils";

export function ProgressAgentLog({
  latestProjectAt,
  latestBlockerAt,
  nextMilestoneAt,
  latestMinuteAt,
  streamCount,
  blockerCount,
  completedCount,
  milestoneCount,
  minuteCount,
}: {
  latestProjectAt?: string;
  latestBlockerAt?: string;
  nextMilestoneAt?: string;
  latestMinuteAt?: string;
  streamCount: number;
  blockerCount: number;
  completedCount: number;
  milestoneCount: number;
  minuteCount: number;
}) {
  const entries = [
    { at: latestProjectAt, label: "progress_scan", result: `${streamCount} streams` },
    { at: latestBlockerAt, label: "blocker_detect", result: `${blockerCount} items` },
    {
      at: nextMilestoneAt,
      label: "milestone_sync",
      result: `${milestoneCount} milestones`,
    },
    { at: latestMinuteAt, label: "minutes_index", result: `${minuteCount} indexed` },
    {
      at: latestProjectAt,
      label: "report_draft",
      result: `${completedCount} completed`,
    },
  ];

  return (
    <Card id="agent">
      <CardHeader>
        <div className="flex items-center gap-2">
          <SquareTerminal className="h-4 w-4" aria-hidden />
          <CardTitle>Progress Agent Log</CardTitle>
        </div>
        <Badge tone="green">tracking</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 border-l-2 border-[#6e9a66] pl-3 font-mono text-xs leading-6 text-[#4f483f]">
          {entries.map((entry) => (
            <p key={`${entry.label}-${entry.result}`}>
              <span className="text-[#8b8175]">{formatLogTime(entry.at)}</span>{" "}
              {entry.label} - {entry.result}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
