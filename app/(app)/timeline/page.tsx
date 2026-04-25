import { CalendarPlus, TimerReset } from "lucide-react";
import {
  TimelineGrid,
  timelineLaneCount,
} from "@/components/timeline/timeline-grid";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects } from "@/lib/clapboard-api";
import {
  getAllProjectTasks,
  getHighPriorityOpenTasks,
  getOpenTasks,
  getProjectRevenueTotal,
} from "@/lib/project-selectors";
import { buildTimelineEvents } from "@/lib/timeline-events";
import {
  addDays,
  formatCompactCurrency,
  startOfDay,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

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
  const allTasks = getAllProjectTasks(projects);
  const openTasks = getOpenTasks(allTasks);
  const blockers = getHighPriorityOpenTasks(allTasks);
  const events = buildTimelineEvents(projects);
  const weekRevenue = getProjectRevenueTotal(projects);

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
            {events.length} events / {timelineLaneCount} lanes
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <TimelineGrid days={days} today={today} events={events} />
        </CardContent>
      </Card>

      <p className="text-xs text-[#81786d]">
        週次表示は現在のモックデータから生成しています。外部バックエンド接続時は同じ構造で最新データを表示します。
      </p>
    </div>
  );
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
