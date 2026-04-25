import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  FolderKanban,
  HelpCircle,
  ListTodo,
  MessageSquare,
  TrendingUp,
  JapaneseYen,
} from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { PriorityBadge } from "@/components/project-status-badge";
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
  const highPriorityCount = incompleteTasks.filter(
    (t) => t.priority === "high",
  ).length;
  const monthlyProfit = projects.reduce(
    (total, project) => total + project.revenue - project.cost,
    0,
  );
  const monthlyRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
  const monthlyCost = projects.reduce((sum, p) => sum + p.cost, 0);
  const recentProjects = [...projects].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );

  return (
    <div className="space-y-5">
      <WelcomeCard />

      <section className="grid gap-4 xl:grid-cols-[1fr_440px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            おかえりなさい
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                今日は{incompleteTasks.length}件の未処理タスクがあります
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                下のカードで案件・タスク・収支・ファイルがすぐに確認できます。各カードをクリックすると詳細画面に移動します。
              </p>
            </div>
            <ButtonLink href="/projects" variant="primary" className="shrink-0">
              案件一覧をひらく
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-2">
          <MetricCard
            label="案件数"
            value={`${projects.length}件`}
            helper={`登録済み案件は${projects.length}件です`}
            icon={FolderKanban}
            tone="blue"
          />
          <MetricCard
            label="進行中"
            value={`${activeProjects.length}件`}
            helper={`全${projects.length}件のうち${activeProjects.length}件が進行中`}
            icon={TrendingUp}
            tone="green"
          />
          <MetricCard
            label="今月の利益"
            value={formatCurrency(monthlyProfit)}
            helper={
              monthlyProfit >= 0
                ? "売上が支出を上回っています"
                : "支出が売上を上回っています"
            }
            icon={CircleDollarSign}
            tone={monthlyProfit >= 0 ? "green" : "rose"}
          />
          <MetricCard
            label="未処理タスク"
            value={`${incompleteTasks.length}件`}
            helper={
              highPriorityCount > 0
                ? `高優先度が${highPriorityCount}件あります`
                : "高優先度タスクはありません"
            }
            icon={ListTodo}
            tone={highPriorityCount > 0 ? "rose" : "amber"}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr_0.95fr]">
        <Card id="todo" className="xl:row-span-2">
          <CardHeader>
            <div>
              <CardTitle>今日の未処理タスク</CardTitle>
              <p className="mt-1 text-xs text-[#81786d]">
                クリックすると案件の詳細画面が開きます
              </p>
            </div>
            <span className="rounded-full bg-[#f8d8cb] px-2.5 py-1 text-xs font-bold text-[#9f452c]">
              {incompleteTasks.length}件
            </span>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {incompleteTasks.length === 0 && (
              <EmptyState
                title="未処理のタスクはありません"
                description="すべてのタスクが完了しています。お疲れさまでした。"
                icon={CheckCircle2}
              />
            )}
            {incompleteTasks.slice(0, 6).map((task) => {
              const project = projects.find((p) => p.name === task.projectName);
              return (
                <Link
                  key={task.id}
                  href={project ? `/projects/${project.id}` : "/projects"}
                  className="grid grid-cols-[24px_1fr_auto] items-start gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 transition last:border-b-0 hover:bg-[#fbfaf5]"
                >
                  <span className="mt-0.5 h-4 w-4 rounded-sm border border-[#777066] bg-[#fffefa]" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#312d27]">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-[#8b8175]">
                      {task.projectName}
                    </p>
                  </div>
                  <PriorityBadge priority={task.priority} />
                </Link>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden />
              <CardTitle>最新の議事録</CardTitle>
            </div>
            <span className="text-xs text-[#81786d]">
              {allMinutes.length}件
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {allMinutes.length === 0 && (
              <EmptyState
                title="議事録はまだありません"
                description="案件詳細画面から議事録を追加できます。"
                icon={MessageSquare}
              />
            )}
            {allMinutes.slice(0, 4).map((minute) => (
              <Link
                key={minute.id}
                href="/projects/ai-minutes"
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
                body="今日のタスク・案件・収支・最新の議事録が一画面で見えます。"
              />
              <GuideStep
                num={2}
                title="案件一覧から詳細へ"
                body="左メニューの「案件一覧」または各カードをクリックすると、案件ごとのタスク・議事録・収支・ファイルが見られます。"
              />
              <GuideStep
                num={3}
                title="左の Files でデスクトップを参照"
                body="このパソコンの ~/Desktop の中身が一覧できます。フォルダをクリックすると中身が展開されます。"
              />
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近更新された案件</CardTitle>
            <span className="text-xs text-[#81786d]">直近の更新順</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.slice(0, 4).map((project) => (
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

        <FinanceCard
          profit={monthlyProfit}
          revenue={monthlyRevenue}
          cost={monthlyCost}
        />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden />
              <CardTitle>最近のファイル</CardTitle>
            </div>
            <span className="text-xs text-[#81786d]">{allFiles.length}件</span>
          </CardHeader>
          <CardContent className="space-y-0">
            {allFiles.length === 0 && (
              <EmptyState
                title="ファイルはまだありません"
                description="案件詳細画面の「ファイル」タブから追加できます。"
                icon={FileText}
              />
            )}
            {allFiles.slice(0, 5).map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-dashed border-[#d8d1c4] py-2.5 text-sm transition last:border-b-0 hover:bg-[#fbfaf5]"
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

function WelcomeCard() {
  return (
    <section className="rounded-lg border border-[#a8c3a6] bg-[#edf5ea] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5f8b5b] text-white">
          <Sparkle />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#2f4f2c]">
            ようこそクラップボードへ
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-[#3f5e3d]">
            案件・タスク・議事録・収支・デスクトップのファイルを 1 つの画面で確認できます。
            初めての方は右下の「
            <Link href="#guide" className="font-bold underline">
              使い方ガイド
            </Link>
            」をご覧ください。
          </p>
        </div>
      </div>
    </section>
  );
}

function Sparkle() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 16l.7 1.9 1.9.7-1.9.7-.7 1.9-.7-1.9-1.9-.7 1.9-.7L19 16z" />
    </svg>
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

function FinanceCard({
  profit,
  revenue,
  cost,
}: {
  profit: number;
  revenue: number;
  cost: number;
}) {
  return (
    <Card id="finance">
      <CardHeader>
        <div className="flex items-center gap-2">
          <JapaneseYen className="h-4 w-4" aria-hidden />
          <CardTitle>今月の収支</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">合計</span>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
            利益(売上 − 支出)
          </p>
          <p className="mt-2 text-2xl font-black tracking-normal text-[#312d27]">
            {formatCurrency(profit)}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-md border border-[#a8bed4] bg-[#eef4f8] p-3">
            <p className="text-xs font-bold text-[#315a78]">売上</p>
            <p className="mt-1 text-sm font-black text-[#312d27]">
              {formatCurrency(revenue)}
            </p>
          </div>
          <div className="rounded-md border border-[#d4bd7f] bg-[#fff3c8] p-3">
            <p className="text-xs font-bold text-[#7c5a18]">支出</p>
            <p className="mt-1 text-sm font-black text-[#312d27]">
              {formatCurrency(cost)}
            </p>
          </div>
        </div>
        <p className="text-xs text-[#81786d]">
          各案件の詳細画面でも収支をひと目で確認できます。
        </p>
      </CardContent>
    </Card>
  );
}
