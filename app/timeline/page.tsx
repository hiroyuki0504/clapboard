import {
  Bot,
  CalendarPlus,
  Check,
  FileText,
  JapaneseYen,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects } from "@/lib/clapboard-api";
import { getHighPriorityOpenTasks, getOpenTasks } from "@/lib/project-selectors";
import type { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

type LaneKey = "agent" | "todo" | "files" | "finance";

type TimelineEvent = {
  id: string;
  lane: LaneKey;
  date: Date;
  title: string;
  sub: string;
  tone: "red" | "amber" | "blue" | "green" | "slate";
  href?: string;
};

const lanes: {
  key: LaneKey;
  label: string;
  icon: React.ElementType;
}[] = [
  { key: "agent", label: "Agent Runs", icon: Bot },
  { key: "todo", label: "ToDo", icon: Check },
  { key: "files", label: "Files", icon: FileText },
  { key: "finance", label: "収支 / 日報", icon: JapaneseYen },
];

const toneClass = {
  red: "border-[#9f452c] bg-[#cf623d] text-white",
  amber: "border-[#d4bd7f] bg-[#f4dc92] text-[#5f4a14]",
  blue: "border-[#a8bed4] bg-[#dce8f2] text-[#315a78]",
  green: "border-[#a8c3a6] bg-[#d8ead4] text-[#426c3d]",
  slate: "border-[#bfb6a8] bg-[#d5cabb] text-[#3f382f]",
};

export default async function TimelinePage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const projects = projectsResult.data;
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(today, index - 3),
  );
  const allTasks = projects.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
      dueDate: project.dueDate,
    })),
  );
  const openTasks = getOpenTasks(allTasks);
  const blockers = getHighPriorityOpenTasks(allTasks);
  const events = buildTimelineEvents(projects);
  const weekRevenue = projects.reduce((total, project) => {
    const revenue = project.transactions
      .filter((transaction) => transaction.type === "revenue")
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return total + revenue;
  }, 0);

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            TIMELINE
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                実行履歴と予定のタイムライン
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                レーンごとにAI実行、ToDo、ファイル更新、収支イベントを並べて、今日の前後を確認します。
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex overflow-hidden rounded-md border border-[#423c33]/55 text-sm font-bold">
                <span className="px-3 py-2 text-[#70675b]">時</span>
                <span className="px-3 py-2 text-[#70675b]">日</span>
                <span className="bg-[#312d27] px-3 py-2 text-white">週</span>
                <span className="px-3 py-2 text-[#70675b]">月</span>
              </div>
              <ButtonLink href="/command" variant="secondary" className="h-10 px-3">
                <CalendarPlus className="h-4 w-4" aria-hidden />
                予定を追加
              </ButtonLink>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TimerReset className="h-4 w-4" aria-hidden />
              <CardTitle>今週の状態</CardTitle>
            </div>
            <Badge tone={blockers.length > 0 ? "red" : "green"}>
              {blockers.length > 0 ? "attention" : "clear"}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <Metric label="未完了" value={`${openTasks.length}`} />
            <Metric label="停滞" value={`${blockers.length}`} />
            <Metric label="売上" value={formatCompactCurrency(weekRevenue)} />
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>2026年4月 ・ 週次レーン</CardTitle>
          <span className="text-xs text-[#81786d]">
            {events.length} events / {lanes.length} lanes
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="thin-scrollbar overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[160px_repeat(7,minmax(130px,1fr))] border-b border-[#d8d1c4] bg-[#f3f0e7]">
                <div className="px-4 py-3 text-sm font-black text-[#312d27]">
                  レーン
                </div>
                {days.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`border-l border-[#d8d1c4] px-4 py-3 ${
                      isSameDay(day, today) ? "bg-[#f1dfd4]" : ""
                    }`}
                  >
                    <p className="font-mono text-xs text-[#81786d]">
                      {formatDayNumber(day)}
                    </p>
                    <p
                      className={`mt-1 text-sm font-black ${
                        isSameDay(day, today)
                          ? "text-[#c95d3a]"
                          : "text-[#312d27]"
                      }`}
                    >
                      {formatWeekday(day)}
                      {isSameDay(day, today) ? " 今日" : ""}
                    </p>
                  </div>
                ))}
              </div>

              {lanes.map((lane) => {
                const Icon = lane.icon;

                return (
                  <div
                    key={lane.key}
                    className="grid min-h-[150px] grid-cols-[160px_repeat(7,minmax(130px,1fr))] border-b border-[#e5ded2] last:border-b-0"
                  >
                    <div className="flex items-center gap-2 bg-[#f8f4ec] px-4 py-4 text-sm font-black text-[#312d27]">
                      <Icon className="h-4 w-4" aria-hidden />
                      {lane.label}
                    </div>
                    {days.map((day) => {
                      const dayEvents = events.filter(
                        (event) =>
                          event.lane === lane.key && isSameDay(event.date, day),
                      );

                      return (
                        <div
                          key={`${lane.key}-${day.toISOString()}`}
                          className="space-y-2 border-l border-[#e5ded2] px-3 py-4"
                        >
                          {dayEvents.map((event) => {
                            const eventBody = (
                              <div
                                className={`rounded-md border px-3 py-2 text-xs font-bold shadow-sm ${toneClass[event.tone]}`}
                              >
                                <p className="truncate">{event.title}</p>
                                <p className="mt-1 truncate opacity-80">{event.sub}</p>
                              </div>
                            );

                            if (!event.href) {
                              return <div key={event.id}>{eventBody}</div>;
                            }

                            return (
                              <Link key={event.id} href={event.href}>
                                {eventBody}
                              </Link>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-[#81786d]">
        週次表示は現在のモックデータから生成しています。外部バックエンド接続時は同じ構造で最新データを表示します。
      </p>
    </div>
  );
}

function buildTimelineEvents(projects: Project[]): TimelineEvent[] {
  return projects.flatMap((project) => {
    const events: TimelineEvent[] = [
      {
        id: `${project.id}-agent`,
        lane: "agent",
        date: new Date(project.lastUpdated),
        title: `${project.name.slice(0, 12)}更新`,
        sub: `${project.progress}%`,
        tone: project.status === "at-risk" ? "red" : "slate",
        href: `/projects/${project.id}`,
      },
      ...project.tasks
        .filter((task) => !task.completed)
        .slice(0, 2)
        .map((task) => ({
          id: `${project.id}-${task.id}`,
          lane: "todo" as const,
          date: new Date(project.lastUpdated),
          title: task.title,
          sub: `${project.name} / 締切 ${project.dueDate}`,
          tone: task.priority === "high" ? ("red" as const) : ("amber" as const),
          href: `/projects/${project.id}?tab=progress`,
        })),
      ...project.files.slice(0, 1).map((file) => ({
        id: `${project.id}-${file.id}`,
        lane: "files" as const,
        date: new Date(file.updatedAt),
        title: file.name,
        sub: file.type.toUpperCase(),
        tone: "blue" as const,
        href: `/projects/${project.id}?tab=files`,
      })),
      ...project.transactions.slice(-1).map((transaction) => ({
        id: `${project.id}-${transaction.id}`,
        lane: "finance" as const,
        date: new Date(transaction.date),
        title: transaction.label,
        sub: formatCurrency(transaction.amount),
        tone: transaction.type === "revenue" ? ("green" as const) : ("amber" as const),
        href: `/projects/${project.id}?tab=finance`,
      })),
    ];

    return events.filter((event) => !Number.isNaN(event.date.getTime()));
  });
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3">
      <p className="text-xs font-bold text-[#81786d]">{label}</p>
      <p className="mt-1 text-lg font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDayNumber(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    day: "2-digit",
    month: "2-digit",
  }).format(value);
}

function formatWeekday(value: Date) {
  return new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
  }).format(value);
}

function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 10000) {
    return `¥${Math.round(value / 10000)}万`;
  }

  return formatCurrency(value);
}
