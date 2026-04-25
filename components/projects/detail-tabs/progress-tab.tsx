import { CheckCircle2, Circle } from "lucide-react";
import { PriorityBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectTask } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./_shared";

export function ProgressTab({
  tasks,
  completion,
  openTaskCount,
}: {
  tasks: ProjectTask[];
  completion: number;
  openTaskCount: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>進捗タスク</CardTitle>
          <p className="mt-1 text-sm text-[#81786d]">
            完了率 {completion}% ・ 未完了 {openTaskCount}件
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {tasks.length === 0 && (
          <EmptyState
            title="タスクはまだありません"
            description="このワークにはタスクが登録されていません。"
          />
        )}
        {tasks.map((task) => (
          <div
            key={task.id}
            className="grid gap-4 border-b border-dashed border-[#d8d1c4] px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
          >
            <div className="flex gap-3">
              {task.completed ? (
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#5f8b5b]"
                  aria-label="完了"
                />
              ) : (
                <Circle
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#9a9084]"
                  aria-label="未完了"
                />
              )}
              <div>
                <p
                  className={cn(
                    "font-bold text-[#312d27]",
                    task.completed && "text-[#9a9084] line-through",
                  )}
                >
                  {task.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#70675b]">{task.note}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <PriorityBadge priority={task.priority} />
              <Badge tone={task.completed ? "green" : "slate"}>
                {task.completed ? "完了" : "未完了"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
