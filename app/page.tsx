import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  Gauge,
  GitBranch,
  GitPullRequest,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProjectMinutes, getProjects } from "@/lib/clapboard-api";
import {
  getActiveProjects,
  getAverageProgress,
  getCompletedTasks,
  getHighPriorityOpenTasks,
  getOpenTasks,
} from "@/lib/project-selectors";
import type { Project } from "@/lib/types";
import { buildDateLabel, formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const projectList = projectsResult.data;
  const allMinutes = getProjectMinutes(projectList);
  const activeWorkstreams = getActiveProjects(projectList);
  const allTasks = projectList.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    })),
  );
  const incompleteTasks = getOpenTasks(allTasks);
  const blockerTasks = getHighPriorityOpenTasks(allTasks);
  const completedTasks = getCompletedTasks(allTasks);
  const averageProgress = getAverageProgress(projectList);
  const recentWorkstreams = [...projectList].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
  const dateLabel = buildDateLabel(new Date());

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            {dateLabel} ・ PROGRESS COMMAND
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                今日進めるべきこと - ブロッカー{blockerTasks.length}件
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                まず見るべきタスク、直近の更新、進捗が動いている案件だけに絞って追跡します。
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Badge tone={projectsResult.connected ? "green" : "amber"}>
                {projectsResult.connected ? "Backend API" : "Local API"}
              </Badge>
              <ButtonLink href="/code-review">
                レビュー管制
                <GitPullRequest className="h-4 w-4" aria-hidden />
              </ButtonLink>
              <ButtonLink href="/projects" variant="secondary">
                進捗ボードへ
                <ArrowRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
          <StatPill
            label="進行中"
            value={`${activeWorkstreams.length}`}
            icon={GitBranch}
          />
          <StatPill
            label="平均進捗"
            value={`${averageProgress}%`}
            icon={Gauge}
          />
          <StatPill
            label="完了タスク"
            value={`${completedTasks.length}`}
            icon={CalendarCheck}
          />
          <StatPill
            label="ブロッカー"
            value={`${blockerTasks.length}`}
            icon={AlertTriangle}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card id="todo" className="xl:row-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden />
              <CardTitle>今日の次アクション</CardTitle>
              <Badge tone="red">{incompleteTasks.length}</Badge>
            </div>
            <span className="font-mono text-xs text-[#81786d]">priority order</span>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {incompleteTasks.length === 0 && (
              <EmptyState
                title="未処理のタスクはありません"
                description="すべてのタスクが完了しています。"
                icon={CheckCircle2}
              />
            )}
            {incompleteTasks.slice(0, 6).map((task, index) => (
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
                    {index % 2 === 0 ? "10:00" : "14:00"} ・ {task.projectName}
                  </p>
                </div>
                <Badge
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

        <Card id="updates">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden />
              <CardTitle>最新の進捗メモ</CardTitle>
            </div>
            <span className="font-mono text-xs text-[#81786d]">updates</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {allMinutes.length === 0 && (
              <EmptyState
                title="進捗メモはまだありません"
                description="ワークストリームの詳細画面に記録されます。"
                icon={MessageSquare}
              />
            )}
            {allMinutes.slice(0, 4).map((minute) => (
              <Link
                key={minute.id}
                href={projectDetailHref(minute.projectId, "minutes")}
                className="block border-b border-dashed border-[#d8d1c4] pb-3 transition last:border-b-0 last:pb-0 hover:bg-[#fbfaf5] hover:px-2"
              >
                <p className="text-sm font-bold text-[#312d27]">{minute.title}</p>
                <p className="mt-1 text-xs text-[#81786d]">
                  {minute.projectName} ・ {formatDateTime(minute.createdAt)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card id="workstreams">
          <CardHeader>
            <CardTitle>進捗が動いたワーク</CardTitle>
            <span className="text-xs text-[#81786d]">last 7 days</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentWorkstreams.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={projectDetailHref(
                  project.id,
                  getProjectDashboardTab(project),
                )}
                className="block rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3 transition hover:border-[#c95d3a] hover:bg-[#fffefa]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-[#312d27]">
                    {project.name}
                  </p>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <div className="mb-2 flex items-center justify-between font-mono text-xs text-[#81786d]">
                  <span>次の節目 {formatDate(project.dueDate)}</span>
                  <span>{formatDateTime(project.lastUpdated)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress} className="h-2" />
                  <span className="font-mono text-xs font-bold text-[#70675b]">
                    {project.progress}%
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type DetailTab = "overview" | "progress" | "minutes" | "finance" | "files";

function projectDetailHref(projectId: string, tab: DetailTab) {
  return tab === "overview"
    ? `/projects/${projectId}`
    : `/projects/${projectId}?tab=${tab}`;
}

function getProjectDashboardTab(project: Project): DetailTab {
  const hasBlocker = project.tasks.some(
    (task) => !task.completed && task.priority === "high",
  );

  if (hasBlocker) {
    return "progress";
  }

  if (project.minutes.length > 0) {
    return "minutes";
  }

  return "overview";
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-3">
      <div className="mb-2 flex items-center justify-between text-[#81786d]">
        <span className="text-xs font-bold">{label}</span>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="truncate text-lg font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f0e7] text-[#a39888]">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-bold text-[#5f574d]">{title}</p>
      <p className="text-xs text-[#81786d]">{description}</p>
    </div>
  );
}
