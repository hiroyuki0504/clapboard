import { AlertTriangle, Check, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/_shared";
import { getProjects } from "@/lib/clapboard-api";
import { projectDetailHref } from "@/lib/project-href";
import {
  getAllProjectTasks,
  getCompletedTasks,
  getOpenTasks,
} from "@/lib/project-selectors";
import type { TaskPriority } from "@/lib/types";

export const dynamic = "force-dynamic";

const priorityOrder: Record<TaskPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const priorityLabel: Record<TaskPriority, string> = {
  high: "ブロッカー",
  medium: "通常",
  low: "低",
};

const priorityTone: Record<TaskPriority, "red" | "amber" | "blue"> = {
  high: "red",
  medium: "amber",
  low: "blue",
};

export default async function TasksPage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const allTasks = getAllProjectTasks(projectsResult.data);
  const incomplete = getOpenTasks(allTasks).sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  );
  const completed = getCompletedTasks(allTasks);
  const blockerCount = incomplete.filter(
    (task) => task.priority === "high",
  ).length;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
          TODAY&apos;S TASKS
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-[#2f2b25]">
          今日のタスク
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f665b]">
          すべてのワークストリームの未完了タスクを優先度順にまとめています。タップで該当案件の進捗タブに移動できます。
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge tone="red">未完了 {incomplete.length}件</Badge>
          <Badge tone="amber">ブロッカー {blockerCount}件</Badge>
          <Badge tone="green">完了 {completed.length}件</Badge>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" aria-hidden />
            <CardTitle>未完了タスク</CardTitle>
            <Badge tone="red">{incomplete.length}</Badge>
          </div>
          <span className="font-mono text-xs text-[#81786d]">
            優先度順に表示
          </span>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {incomplete.length === 0 ? (
            <EmptyState
              title="未処理のタスクはありません"
              description="すべてのタスクが完了しています。"
              icon={CheckCircle2}
            />
          ) : (
            incomplete.map((task) => (
              <Link
                key={`${task.projectId}-${task.id}`}
                href={projectDetailHref(task.projectId, "progress")}
                className="grid grid-cols-[24px_1fr_auto] items-start gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 transition last:border-b-0 hover:bg-[#fbfaf5]"
              >
                <span className="mt-0.5 h-4 w-4 rounded-sm border border-[#777066] bg-[#fffefa]" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#312d27]">
                    {task.title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#8b8175]">
                    {task.projectName}
                  </p>
                  {task.note && (
                    <p className="mt-1 text-xs leading-5 text-[#70675b]">
                      {task.note}
                    </p>
                  )}
                </div>
                <Badge tone={priorityTone[task.priority]}>
                  {priorityLabel[task.priority]}
                </Badge>
              </Link>
            ))
          )}
        </CardContent>
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
              <CardTitle>完了したタスク</CardTitle>
              <Badge tone="green">{completed.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {completed.slice(0, 8).map((task) => (
              <Link
                key={`${task.projectId}-${task.id}`}
                href={projectDetailHref(task.projectId, "progress")}
                className="grid grid-cols-[24px_1fr_auto] items-start gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-3 transition last:border-b-0 hover:bg-[#fbfaf5]"
              >
                <span className="mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border border-[#5f8b5b] bg-[#edf5ea] text-[#5f8b5b]">
                  <Check className="h-3 w-3" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm text-[#5f574d] line-through">
                    {task.title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#8b8175]">
                    {task.projectName}
                  </p>
                </div>
                <Badge tone="green">完了</Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      {blockerCount > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-[#e2ac98] bg-[#fdf0ec] p-3 text-xs leading-5 text-[#9f452c]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>
            ブロッカーのタスクが {blockerCount}{" "}
            件あります。担当案件の進捗タブで状況を確認してください。
          </span>
        </p>
      )}
    </div>
  );
}
