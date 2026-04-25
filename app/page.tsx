import {
  ArrowRight,
  Bot,
  Check,
  CircleDollarSign,
  FileText,
  FolderKanban,
  ListTodo,
  MessageSquare,
  Network,
  SquareTerminal,
  TrendingUp,
  JapaneseYen,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { allFiles, allMinutes, projects } from "@/lib/mock-data";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const activeProjects = projects.filter(
    (project) => project.status !== "completed",
  );
  const incompleteTasks = projects.flatMap((project) =>
    project.tasks
      .filter((task) => !task.completed)
      .map((task) => ({ ...task, projectName: project.name })),
  );
  const monthlyProfit = projects.reduce(
    (total, project) => total + project.revenue - project.cost,
    0,
  );
  const recentProjects = [...projects].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            2026/04/25 SAT
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                おかえりなさい — 今日は{incompleteTasks.length}件の未処理タスク
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                案件の進捗、議事録、収支、Google Driveファイルを同じワークスペースで確認できます。
              </p>
            </div>
            <ButtonLink href="/projects" variant="secondary" className="shrink-0">
              案件一覧へ
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          <MetricCard
            label="案件数"
            value={`${projects.length}`}
            helper={`登録済み案件は${projects.length}件`}
            icon={FolderKanban}
            tone="blue"
          />
          <MetricCard
            label="進行中"
            value={`${activeProjects.length}`}
            helper={`${activeProjects.length}/${projects.length} が進行中`}
            icon={TrendingUp}
            tone="green"
          />
          <MetricCard
            label="今月収支"
            value={formatCurrency(monthlyProfit)}
            helper={monthlyProfit >= 0 ? "黒字維持" : "赤字注意"}
            icon={CircleDollarSign}
            tone={monthlyProfit >= 0 ? "green" : "rose"}
          />
          <MetricCard
            label="未処理"
            value={`${incompleteTasks.length}`}
            helper={`高優先度 ${incompleteTasks.filter((t) => t.priority === "high").length}件`}
            icon={ListTodo}
            tone={incompleteTasks.length > 5 ? "rose" : "amber"}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr_0.95fr]">
        <Card id="todo" className="xl:row-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden />
              <CardTitle>ToDo・今日</CardTitle>
              <Badge tone="red">{incompleteTasks.length}</Badge>
            </div>
            <div className="flex overflow-hidden rounded-md border border-[#423c33]/55 text-xs font-semibold">
              <span className="bg-[#312d27] px-3 py-1.5 text-white">今日</span>
              <span className="px-3 py-1.5 text-[#70675b]">今週</span>
              <span className="px-3 py-1.5 text-[#70675b]">すべて</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {incompleteTasks.slice(0, 6).map((task, index) => (
              <div
                key={task.id}
                className="grid grid-cols-[24px_1fr_auto] items-start gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 last:border-b-0"
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
                    ? "重要"
                    : task.priority === "medium"
                      ? "通常"
                      : "低"}
                </Badge>
              </div>
            ))}
            <div className="p-4">
              <button className="h-10 w-full rounded-md border border-[#d8d1c4] bg-[#fffefa] text-left text-sm text-[#9a9084]">
                <span className="px-4">＋ タスクを追加...</span>
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden />
              <CardTitle>最新議事録</CardTitle>
            </div>
            <span className="font-mono text-xs text-[#81786d]">minutes</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {allMinutes.slice(0, 4).map((minute) => (
              <Link
                key={minute.id}
                href="/projects/ai-minutes"
                className="block border-b border-dashed border-[#d8d1c4] pb-3 last:border-b-0 last:pb-0"
              >
                <p className="text-sm font-bold text-[#312d27]">{minute.title}</p>
                <p className="mt-1 text-xs text-[#81786d]">
                  {minute.projectName} ・ {formatDateTime(minute.createdAt)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card id="agent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SquareTerminal className="h-4 w-4" aria-hidden />
              <CardTitle>Agent Log</CardTitle>
            </div>
            <Badge tone="green">running</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 border-l-2 border-[#6e9a66] pl-3 font-mono text-xs leading-6 text-[#4f483f]">
              <p><span className="text-[#8b8175]">08:02</span> cw_scraper → 3 items</p>
              <p><span className="text-[#8b8175]">08:03</span> ai_extract → normalized</p>
              <p><span className="text-[#8b8175]">10:15</span> todo_add → project#2</p>
              <p><span className="text-[#8b8175]">10:16</span> drive_upload → share link</p>
              <p><span className="text-[#8b8175]">11:32</span> finance_check recovered</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近更新された案件</CardTitle>
            <span className="text-xs text-[#81786d]">last 7 days</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3 transition hover:border-[#c95d3a]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-[#312d27]">
                    {project.name}
                  </p>
                  <ProjectStatusBadge status={project.status} />
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

        <GraphCard />

        <FinanceCard profit={monthlyProfit} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden />
              <CardTitle>最近のファイル</CardTitle>
            </div>
            <span className="text-xs text-[#81786d]">{allFiles.length}件</span>
          </CardHeader>
          <CardContent className="space-y-0">
            {allFiles.slice(0, 5).map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-dashed border-[#d8d1c4] py-2.5 text-sm last:border-b-0"
              >
                <span className="truncate text-[#312d27]">{file.name}</span>
                <span className="text-xs text-[#81786d]">
                  {formatDateTime(file.updatedAt)}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function GraphCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4" aria-hidden />
          <CardTitle>ファイル関係グラフ</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">最近7日</span>
      </CardHeader>
      <CardContent>
        <div className="dotted-canvas relative h-52 overflow-hidden rounded-md border border-[#d8d1c4] bg-[#fffefa]">
          <div className="absolute left-6 top-9 z-10 rounded-full border border-[#d66b43] bg-[#fffefa] px-3 py-1 text-xs font-bold text-[#9a4a31]">
            案件サマリ
          </div>
          <div className="absolute left-32 top-28 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            議事録
          </div>
          <div className="absolute right-8 top-20 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            LP_design
          </div>
          <div className="absolute left-48 top-14 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            spec.pdf
          </div>
          <span className="absolute left-[82px] top-[78px] h-px w-24 rotate-45 bg-[#c8c0b4]" />
          <span className="absolute left-[178px] top-[94px] h-px w-20 -rotate-45 bg-[#c8c0b4]" />
          <span className="absolute right-[82px] top-[82px] h-px w-24 rotate-[20deg] bg-[#c8c0b4]" />
          <div className="absolute bottom-5 left-7 rotate-[-2deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415] shadow-sm">
            ノード = 案件・議事録・ファイル
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceCard({ profit }: { profit: number }) {
  const bars = [34, 48, 38, 58, 46, 67, 78, 92];

  return (
    <Card id="finance">
      <CardHeader>
        <div className="flex items-center gap-2">
          <JapaneseYen className="h-4 w-4" aria-hidden />
          <CardTitle>収支・4月</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">更新: 今</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#81786d]">粗利</p>
            <p className="mt-2 text-2xl font-black tracking-normal text-[#312d27]">
              {formatCurrency(profit)}
            </p>
          </div>
          <div className="text-right text-sm font-bold text-[#5f8b5b]">
            +18.2%
          </div>
        </div>
        <div className="mt-6 flex h-24 items-end gap-2">
          {bars.map((bar, index) => (
            <span
              key={bar}
              className={index > 5 ? "flex-1 rounded-t-sm bg-[#cf623d]" : "flex-1 rounded-t-sm bg-[#cfc5b4]"}
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-[#81786d]">今週の日報: 4/5投稿済み</p>
      </CardContent>
    </Card>
  );
}
