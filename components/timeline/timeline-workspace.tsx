"use client";

import { CalendarPlus, TimerReset, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  type TimelineGridEvent,
  TimelineGrid,
  timelineLaneCount,
} from "@/components/timeline/timeline-grid";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LaneKey, TimelineEventTone } from "@/lib/timeline-events";
import {
  addAppDays,
  formatCompactCurrency,
  parseAppDateKey,
} from "@/lib/utils";

type ViewMode = "hour" | "day" | "week" | "month";

export type SerializableTimelineEvent = {
  id: string;
  lane: LaneKey;
  dateKey: string;
  title: string;
  sub: string;
  tone: TimelineEventTone;
  href?: string;
};

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: "hour", label: "時" },
  { key: "day", label: "日" },
  { key: "week", label: "週" },
  { key: "month", label: "月" },
];

const LANE_OPTIONS: { value: LaneKey; label: string }[] = [
  { value: "agent", label: "Agent Runs" },
  { value: "todo", label: "ToDo" },
  { value: "files", label: "Files" },
  { value: "finance", label: "収支 / 日報" },
];

const TONE_OPTIONS: { value: TimelineEventTone; label: string }[] = [
  { value: "slate", label: "標準" },
  { value: "blue", label: "情報" },
  { value: "green", label: "完了" },
  { value: "amber", label: "注意" },
  { value: "red", label: "緊急" },
];

function rangeFor(mode: ViewMode, todayKey: string): string[] {
  switch (mode) {
    case "hour":
      return [todayKey];
    case "day":
      return Array.from({ length: 3 }, (_, i) => addAppDays(todayKey, i - 1));
    case "week":
      return Array.from({ length: 7 }, (_, i) => addAppDays(todayKey, i - 3));
    case "month":
      return Array.from({ length: 30 }, (_, i) => addAppDays(todayKey, i - 7));
  }
}

function rangeLabel(mode: ViewMode, todayKey: string): string {
  const ym = new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    timeZone: "Asia/Tokyo",
  }).format(parseAppDateKey(todayKey));
  switch (mode) {
    case "hour":
      return `${ym} ・ 当日レーン`;
    case "day":
      return `${ym} ・ 日次レーン (前後3日)`;
    case "week":
      return `${ym} ・ 週次レーン`;
    case "month":
      return `${ym} ・ 月次レーン (30日)`;
  }
}

export function TimelineWorkspace({
  initialEvents,
  todayKey,
  openTasksCount,
  blockersCount,
  weekRevenue,
}: {
  initialEvents: SerializableTimelineEvent[];
  todayKey: string;
  openTasksCount: number;
  blockersCount: number;
  weekRevenue: number;
}) {
  const [mode, setMode] = useState<ViewMode>("week");
  const [customEvents, setCustomEvents] = useState<SerializableTimelineEvent[]>(
    [],
  );
  const [deletedEventIds, setDeletedEventIds] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftSub, setDraftSub] = useState("");
  const [draftLane, setDraftLane] = useState<LaneKey>("agent");
  const [draftTone, setDraftTone] = useState<TimelineEventTone>("slate");
  const [draftDate, setDraftDate] = useState<string>(todayKey);

  const dateKeys = useMemo(() => rangeFor(mode, todayKey), [mode, todayKey]);

  const events: TimelineGridEvent[] = useMemo(
    () => [
      ...initialEvents.filter((event) => !deletedEventIds.includes(event.id)),
      ...customEvents,
    ],
    [initialEvents, customEvents, deletedEventIds],
  );

  const closeDialog = () => {
    setDialogOpen(false);
    setDraftTitle("");
    setDraftSub("");
    setDraftLane("agent");
    setDraftTone("slate");
    setDraftDate(todayKey);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draftTitle.trim();
    if (!title) return;
    setCustomEvents((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        lane: draftLane,
        dateKey: draftDate,
        title,
        sub: draftSub.trim() || "ユーザー追加",
        tone: draftTone,
      },
    ]);
    closeDialog();
  };

  const deleteEvent = (eventId: string) => {
    setCustomEvents((prev) => prev.filter((event) => event.id !== eventId));
    setDeletedEventIds((prev) =>
      prev.includes(eventId) ? prev : [...prev, eventId],
    );
  };

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
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center lg:shrink-0">
              <div
                role="tablist"
                aria-label="表示範囲"
                className="flex overflow-hidden rounded-md border border-[#423c33]/55 text-sm font-bold"
              >
                {VIEW_MODES.map((vm) => {
                  const active = mode === vm.key;
                  return (
                    <button
                      key={vm.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setMode(vm.key)}
                      className={`flex-1 px-3 py-2 transition-colors sm:flex-none ${
                        active
                          ? "bg-[#312d27] text-white"
                          : "text-[#70675b] hover:bg-[#f1ede4]"
                      }`}
                    >
                      {vm.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDraftDate(todayKey);
                  setDialogOpen(true);
                }}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-[#423c33]/55 bg-[#fbfaf5] px-3 text-sm font-bold text-[#312d27] hover:bg-[#f1ede4] sm:w-auto"
              >
                <CalendarPlus className="h-4 w-4" aria-hidden />
                予定を追加
              </button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TimerReset className="h-4 w-4" aria-hidden />
              <CardTitle>今週の状態</CardTitle>
            </div>
            <Badge tone={blockersCount > 0 ? "red" : "green"}>
              {blockersCount > 0 ? "attention" : "clear"}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <Metric label="未完了" value={`${openTasksCount}`} />
            <Metric label="停滞" value={`${blockersCount}`} />
            <Metric label="売上" value={formatCompactCurrency(weekRevenue)} />
          </CardContent>
        </Card>
      </section>

      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>{rangeLabel(mode, todayKey)}</CardTitle>
          <span className="text-xs text-[#81786d]">
            {events.length} events / {timelineLaneCount} lanes
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <TimelineGrid
            dateKeys={dateKeys}
            todayKey={todayKey}
            events={events}
            onDeleteEvent={deleteEvent}
          />
        </CardContent>
      </Card>

      {customEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>追加した予定</CardTitle>
            <Badge tone="green">{customEvents.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {customEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-md border border-[#d8d1c4] bg-[#fbfaf5] px-3 py-2"
              >
                <div>
                  <p className="font-bold text-[#312d27]">{event.title}</p>
                  <p className="text-xs text-[#81786d]">
                    {event.dateKey} ・ {event.sub}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteEvent(event.id)}
                  className="rounded-md border border-[#c8c0b4] px-2 py-1 text-xs font-bold text-[#5f574d] hover:bg-[#f1ede4]"
                >
                  削除
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-[#81786d]">
        週次表示は現在のモックデータから生成しています。外部バックエンド接続時は同じ構造で最新データを表示します。
      </p>

      {dialogOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="予定を追加"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDialog();
          }}
        >
          <form
            onSubmit={submit}
            className="w-full max-w-md space-y-4 rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#2f2b25]">予定を追加</h3>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md p-1 text-[#70675b] hover:bg-[#f1ede4]"
                aria-label="閉じる"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-bold text-[#312d27]">タイトル</span>
              <input
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                required
                autoFocus
                className="h-10 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm outline-none focus:border-[#312d27]"
                placeholder="例: レビュー打ち合わせ"
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-bold text-[#312d27]">補足</span>
              <input
                value={draftSub}
                onChange={(e) => setDraftSub(e.target.value)}
                className="h-10 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm outline-none focus:border-[#312d27]"
                placeholder="メモ / プロジェクト名など"
              />
            </label>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="block">
                <span className="mb-1 block font-bold text-[#312d27]">日付</span>
                <input
                  type="date"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  required
                  className="h-10 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm outline-none focus:border-[#312d27]"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-bold text-[#312d27]">レーン</span>
                <select
                  value={draftLane}
                  onChange={(e) => setDraftLane(e.target.value as LaneKey)}
                  className="h-10 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm outline-none focus:border-[#312d27]"
                >
                  {LANE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-bold text-[#312d27]">トーン</span>
              <select
                value={draftTone}
                onChange={(e) =>
                  setDraftTone(e.target.value as TimelineEventTone)
                }
                className="h-10 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm outline-none focus:border-[#312d27]"
              >
                {TONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeDialog}
                className="h-10 rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-4 text-sm font-bold text-[#5f574d] hover:bg-[#f1ede4]"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="h-10 rounded-md bg-[#312d27] px-4 text-sm font-bold text-white hover:bg-[#1f1c18]"
              >
                追加する
              </button>
            </div>
          </form>
        </div>
      )}
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
