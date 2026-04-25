import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  Check,
  CheckCircle2,
  FileText,
  Gauge,
  GitBranch,
  GitPullRequest,
  HelpCircle,
  MessageSquare,
  Network,
  Sparkles,
  SquareTerminal,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getProjectFiles,
  getProjectMinutes,
  getProjects,
} from "@/lib/clapboard-api";
import type { Project } from "@/lib/types";
import { buildDateLabel, formatDate, formatDateTime, safeFileUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const projectList = projectsResult.data;
  const allFiles = getProjectFiles(projectList);
  const allMinutes = getProjectMinutes(projectList);
  const activeWorkstreams = projectList.filter(
    (project) => project.status !== "completed",
  );
  const allTasks = projectList.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    })),
  );
  const incompleteTasks = allTasks.filter((task) => !task.completed);
  const blockerTasks = incompleteTasks.filter((task) => task.priority === "high");
  const completedTasks = allTasks.filter((task) => task.completed);
  const averageProgress =
    projectList.length === 0
      ? 0
      : Math.round(
          projectList.reduce((total, project) => total + project.progress, 0) /
            projectList.length,
        );
  const recentWorkstreams = [...projectList].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
  const milestoneCount = activeWorkstreams.filter((project) =>
    Boolean(project.dueDate),
  ).length;
  const dateLabel = buildDateLabel(new Date());

  return (
    <div className="space-y-4">
      <WelcomeCard />

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
                ワークストリームごとの進捗率、次の節目、停滞タスク、更新ログを一画面で追跡します。
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

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr_0.95fr]">
        <Card id="todo" className="xl:row-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" aria-hidden />
              <CardTitle>今日の次アクション</CardTitle>
              <Badge tone="red">{incompleteTasks.length}</Badge>
            </div>
            <div className="flex overflow-hidden rounded-md border border-[#423c33]/55 text-xs font-semibold">
              <span className="bg-[#312d27] px-3 py-1.5 text-white">今日</span>
              <span className="px-3 py-1.5 text-[#70675b]">今週</span>
              <span className="px-3 py-1.5 text-[#70675b]">停滞</span>
            </div>
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
                href={`/projects/${task.projectId}`}
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

        <Card>
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
                href={`/projects/${minute.projectId}`}
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

        <Card id="guide">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
              <CardTitle>使い方ガイド</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm leading-6 text-[#5f574d]">
              <GuideStep
                num={1}
                title="ダッシュボードで全体を確認"
                body="今日の次アクション、ブロッカー、直近の更新を最初に見ます。"
              />
              <GuideStep
                num={2}
                title="進捗ボードから詳細へ"
                body="ワークストリーム名や「開く」ボタンを押すと、タスク・メモ・予算・ファイルを確認できます。"
              />
              <GuideStep
                num={3}
                title="左の Desktop Files を参照"
                body="このパソコンの ~/Desktop をそのまま展開できます。名前で絞り込みもできます。"
              />
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>進捗が動いたワーク</CardTitle>
            <span className="text-xs text-[#81786d]">last 7 days</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentWorkstreams.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
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

        <Card id="agent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SquareTerminal className="h-4 w-4" aria-hidden />
              <CardTitle>Progress Agent Log</CardTitle>
            </div>
            <Badge tone="green">tracking</Badge>
          </CardHeader>
          <CardContent>
            <ProgressAgentLog
              streamCount={activeWorkstreams.length}
              blockerCount={blockerTasks.length}
              completedCount={completedTasks.length}
              milestoneCount={milestoneCount}
              minuteCount={allMinutes.length}
            />
          </CardContent>
        </Card>

        <DependencyGraphCard projects={projectList} />

        <WeeklyProgressCard
          averageProgress={averageProgress}
          completedCount={completedTasks.length}
          blockerCount={blockerTasks.length}
          milestoneCount={milestoneCount}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden />
              <CardTitle>進捗に紐づくファイル</CardTitle>
            </div>
            <span className="text-xs text-[#81786d]">{allFiles.length}件</span>
          </CardHeader>
          <CardContent className="space-y-0">
            {allFiles.length === 0 && (
              <EmptyState
                title="ファイルはまだありません"
                description="詳細画面のファイルタブから確認できます。"
                icon={FileText}
              />
            )}
            {allFiles.slice(0, 5).map((file) => {
              const safeUrl = safeFileUrl(file.url);
              const className =
                "grid grid-cols-[1fr_auto] gap-3 border-b border-dashed border-[#d8d1c4] py-2.5 text-sm transition last:border-b-0 hover:bg-[#fbfaf5]";
              const content = (
                <>
                  <span className="truncate text-[#312d27]">{file.name}</span>
                  <span className="text-xs text-[#81786d]">
                    {formatDateTime(file.updatedAt)}
                  </span>
                </>
              );

              if (!safeUrl) {
                return (
                  <div
                    key={file.id}
                    className={`${className} text-[#9a4a31]`}
                    title="無効なURLのためリンクを無効化しています"
                  >
                    {content}
                  </div>
                );
              }

              return (
                <a
                  key={file.id}
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={className}
                >
                  {content}
                </a>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function WelcomeCard() {
  return (
    <section className="rounded-lg border border-[#a8c3a6] bg-[#edf5ea] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5f8b5b] text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#2f4f2c]">
            ようこそ ClawBoard へ
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-[#3f5e3d]">
            進捗・タスク・レビュー・デスクトップのファイルを 1 つの画面で確認できます。
            初めての方は「
            <Link href="#guide" className="font-bold underline">
              使い方ガイド
            </Link>
            」から見ると全体像をつかみやすいです。
          </p>
        </div>
      </div>
    </section>
  );
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

function GuideStep({
  num,
  title,
  body,
}: {
  num: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5f8b5b] text-xs font-black text-white">
        {num}
      </span>
      <div>
        <p className="text-sm font-bold text-[#312d27]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#70675b]">{body}</p>
      </div>
    </li>
  );
}

function ProgressAgentLog({
  streamCount,
  blockerCount,
  completedCount,
  milestoneCount,
  minuteCount,
}: {
  streamCount: number;
  blockerCount: number;
  completedCount: number;
  milestoneCount: number;
  minuteCount: number;
}) {
  const entries = [
    { time: "08:02", label: "progress_scan", result: `${streamCount} streams` },
    { time: "08:03", label: "blocker_detect", result: `${blockerCount} items` },
    { time: "10:15", label: "milestone_sync", result: `${milestoneCount} updated` },
    { time: "10:16", label: "minutes_index", result: `${minuteCount} indexed` },
    { time: "11:32", label: "report_draft", result: `${completedCount} completed` },
  ];

  return (
    <div className="space-y-2 border-l-2 border-[#6e9a66] pl-3 font-mono text-xs leading-6 text-[#4f483f]">
      {entries.map((entry) => (
        <p key={`${entry.time}-${entry.label}`}>
          <span className="text-[#8b8175]">{entry.time}</span> {entry.label} -{" "}
          {entry.result}
        </p>
      ))}
    </div>
  );
}

function DependencyGraphCard({ projects }: { projects: Project[] }) {
  const focus = projects[0];
  const focusLabel = focus
    ? `${focus.name.slice(0, 8)} ${focus.progress}%`
    : "進捗未取得";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4" aria-hidden />
          <CardTitle>進捗依存グラフ</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">blocked path</span>
      </CardHeader>
      <CardContent>
        <div className="dotted-canvas relative h-52 overflow-hidden rounded-md border border-[#d8d1c4] bg-[#fffefa]">
          <div className="absolute left-6 top-9 z-10 rounded-full border border-[#d66b43] bg-[#fffefa] px-3 py-1 text-xs font-bold text-[#9a4a31]">
            {focusLabel}
          </div>
          <div className="absolute left-32 top-28 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            レビュー待ち
          </div>
          <div className="absolute right-8 top-20 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            リリース判定
          </div>
          <div className="absolute left-48 top-14 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            仕様確定
          </div>
          <span className="absolute left-[82px] top-[78px] h-px w-24 rotate-45 bg-[#c8c0b4]" />
          <span className="absolute left-[178px] top-[94px] h-px w-20 -rotate-45 bg-[#c8c0b4]" />
          <span className="absolute right-[82px] top-[82px] h-px w-24 rotate-[20deg] bg-[#c8c0b4]" />
          <div className="absolute bottom-5 left-7 rotate-[-2deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415] shadow-sm">
            線 = 依存関係 / 赤枠 = 停滞ポイント
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WeeklyProgressCard({
  averageProgress,
  completedCount,
  blockerCount,
  milestoneCount,
}: {
  averageProgress: number;
  completedCount: number;
  blockerCount: number;
  milestoneCount: number;
}) {
  const start = Math.max(0, averageProgress - 9);
  const delta = averageProgress - start;
  const bars = Array.from({ length: 8 }, (_, index) => {
    const ratio = index / 7;
    const value = Math.round(start + delta * ratio);
    return Math.max(8, Math.min(100, value));
  });

  return (
    <Card id="timeline">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TimerReset className="h-4 w-4" aria-hidden />
          <CardTitle>今週の進捗推移（イメージ）</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">サンプル / 実日次データ未接続</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#81786d]">平均進捗（現在値）</p>
            <p className="mt-2 text-2xl font-black tracking-normal text-[#312d27]">
              {start}% - {averageProgress}%
            </p>
          </div>
          <div className="text-right text-sm font-bold text-[#5f8b5b]">
            {delta >= 0 ? "+" : ""}
            {delta}pt
          </div>
        </div>
        <div className="mt-6 flex h-24 items-end gap-2">
          {bars.map((bar, index) => (
            <span
              key={`bar-${index}`}
              className={
                index > 5
                  ? "flex-1 rounded-t-sm bg-[#cf623d]"
                  : "flex-1 rounded-t-sm bg-[#cfc5b4]"
              }
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-[#81786d]">
          今週: 完了 {completedCount}件 / ブロッカー {blockerCount}件 / 節目 {milestoneCount}件
        </p>
      </CardContent>
    </Card>
  );
}
