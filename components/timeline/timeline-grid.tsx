import { Bot, Check, FileText, JapaneseYen } from "lucide-react";
import Link from "next/link";
import type {
  LaneKey,
  TimelineEvent,
  TimelineEventTone,
} from "@/lib/timeline-events";
import {
  formatDayNumber,
  formatWeekday,
  isSameDay,
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

export function TimelineGrid({
  days,
  today,
  events,
}: {
  days: Date[];
  today: Date;
  events: TimelineEvent[];
}) {
  const columnCount = Math.max(days.length, 1);
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
                  isSameDay(day, today) ? "text-[#c95d3a]" : "text-[#312d27]"
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
              className="grid min-h-[150px] border-b border-[#e5ded2] last:border-b-0"
              style={{ gridTemplateColumns }}
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
  );
}
