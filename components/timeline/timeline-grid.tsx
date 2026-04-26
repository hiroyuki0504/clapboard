import { Bot, Check, FileText, JapaneseYen, Trash2 } from "lucide-react";
import Link from "next/link";
import type { LaneKey, TimelineEventTone } from "@/lib/timeline-events";
import {
  formatDayNumber,
  formatWeekday,
  parseAppDateKey,
} from "@/lib/utils";

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

const toneClass: Record<TimelineEventTone, string> = {
  red: "border-[#9f452c] bg-[#cf623d] text-white",
  amber: "border-[#d4bd7f] bg-[#f4dc92] text-[#5f4a14]",
  blue: "border-[#a8bed4] bg-[#dce8f2] text-[#315a78]",
  green: "border-[#a8c3a6] bg-[#d8ead4] text-[#426c3d]",
  slate: "border-[#bfb6a8] bg-[#d5cabb] text-[#3f382f]",
};

export const timelineLaneCount = lanes.length;

export type TimelineGridEvent = {
  id: string;
  lane: LaneKey;
  dateKey: string;
  title: string;
  sub: string;
  tone: TimelineEventTone;
  href?: string;
};

export function TimelineGrid({
  dateKeys,
  todayKey,
  events,
  onDeleteEvent,
}: {
  dateKeys: string[];
  todayKey: string;
  events: TimelineGridEvent[];
  onDeleteEvent?: (eventId: string) => void;
}) {
  const columnCount = Math.max(dateKeys.length, 1);
  const gridTemplateColumns = `160px repeat(${columnCount}, minmax(130px, 1fr))`;
  const minWidth = `${160 + columnCount * 130}px`;
  return (
    <div className="thin-scrollbar overflow-x-auto">
      <div style={{ minWidth }}>
        <div
          className="grid border-b border-[#d8d1c4] bg-[#f3f0e7]"
          style={{ gridTemplateColumns }}
        >
          <div className="px-4 py-3 text-sm font-black text-[#312d27]">
            レーン
          </div>
          {dateKeys.map((dateKey) => {
            const isToday = dateKey === todayKey;
            const date = parseAppDateKey(dateKey);
            return (
              <div
                key={dateKey}
                className={`border-l border-[#d8d1c4] px-4 py-3 ${
                  isToday ? "bg-[#f1dfd4]" : ""
                }`}
              >
                <p className="font-mono text-xs text-[#81786d]">
                  {formatDayNumber(date)}
                </p>
                <p
                  className={`mt-1 text-sm font-black ${
                    isToday ? "text-[#c95d3a]" : "text-[#312d27]"
                  }`}
                >
                  {formatWeekday(date)}
                  {isToday ? " 今日" : ""}
                </p>
              </div>
            );
          })}
        </div>

        {lanes.map((lane) => {
          const Icon = lane.icon;

          return (
            <div
              key={lane.key}
              className="grid min-h-[150px] border-b border-[#e5ded2] last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              <div className="flex items-center gap-2 bg-[#f8f4ec] px-4 py-4 text-sm font-black text-[#312d27]">
                <Icon className="h-4 w-4" aria-hidden />
                {lane.label}
              </div>
              {dateKeys.map((dateKey) => {
                const dayEvents = events.filter(
                  (event) =>
                    event.lane === lane.key && event.dateKey === dateKey,
                );

                return (
                  <div
                    key={`${lane.key}-${dateKey}`}
                    className="space-y-2 border-l border-[#e5ded2] px-3 py-4"
                  >
                    {dayEvents.map((event) => {
                      const eventBody = (
                        <>
                          <p className="truncate">{event.title}</p>
                          <p className="mt-1 truncate opacity-80">{event.sub}</p>
                        </>
                      );
                      const eventClassName = `rounded-md border px-3 py-2 text-xs font-bold shadow-sm ${toneClass[event.tone]}`;
                      const deleteButton = onDeleteEvent ? (
                        <button
                          type="button"
                          onClick={() => onDeleteEvent(event.id)}
                          className="ml-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded border border-current/30 opacity-80 transition hover:bg-white/20 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
                          aria-label={`予定「${event.title}」を削除`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      ) : null;

                      if (!event.href) {
                        return (
                          <div
                            key={event.id}
                            className={`${eventClassName} flex items-start justify-between gap-2`}
                          >
                            <div className="min-w-0 flex-1">{eventBody}</div>
                            {deleteButton}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={event.id}
                          className={`${eventClassName} flex items-start justify-between gap-2`}
                        >
                          <Link className="min-w-0 flex-1" href={event.href}>
                            {eventBody}
                          </Link>
                          {deleteButton}
                        </div>
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
  );
}
