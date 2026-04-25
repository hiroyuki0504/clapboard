import { Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailHref } from "@/lib/project-href";
import type { ProjectTask } from "@/lib/types";
import { EmptyState } from "./_shared";

type TodoTask = ProjectTask & { projectId: string; projectName: string };

export function TodoSection({ tasks }: { tasks: TodoTask[] }) {
  return (
    <Card id="todo" className="xl:row-span-2">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4" aria-hidden />
          <CardTitle>今日の次アクション</CardTitle>
          <Badge tone="red">{tasks.length}</Badge>
        </div>
        <div className="flex overflow-hidden rounded-md border border-[#423c33]/55 text-xs font-semibold">
          <span className="bg-[#312d27] px-3 py-1.5 text-white">今日</span>
          <span className="px-3 py-1.5 text-[#70675b]">今週</span>
          <span className="px-3 py-1.5 text-[#70675b]">停滞</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {tasks.length === 0 && (
          <EmptyState
            title="未処理のタスクはありません"
            description="すべてのタスクが完了しています。"
            icon={CheckCircle2}
          />
        )}
        {tasks.slice(0, 6).map((task, index) => (
          <Link
            key={`${task.projectId}-${task.id}`}
            href={projectDetailHref(task.projectId, "progress")}
            className="grid grid-cols-[24px_1fr] items-start gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 transition last:border-b-0 hover:bg-[#fbfaf5] sm:grid-cols-[24px_1fr_auto]"
          >
            <span className="mt-0.5 h-4 w-4 rounded-sm border border-[#777066] bg-[#fffefa]" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#312d27]">
                {task.title}
              </p>
              <p className="mt-1 font-mono text-xs text-[#8b8175]">
                {index % 2 === 0 ? "10:00" : "14:00"} ・ {task.projectName}
              </p>
            </div>
            <Badge
              className="col-start-2 w-fit sm:col-start-auto"
              tone={
                task.priority === "high"
                  ? "red"
                  : task.priority === "medium"
                    ? "amber"
                    : "blue"
              }
            >
              {task.priority === "high"
                ? "ブロッカー"
                : task.priority === "medium"
                  ? "通常"
                  : "低"}
            </Badge>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
