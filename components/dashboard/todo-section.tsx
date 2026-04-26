"use client";

import { Check, CheckCircle2, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailHref } from "@/lib/project-href";
import type { ProjectTask } from "@/lib/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "./_shared";

type TodoTask = ProjectTask & { projectId: string; projectName: string };

const hiddenTodayTaskStoragePrefix = "clapboard:hidden-today-tasks:";

export function TodoSection({ tasks }: { tasks: TodoTask[] }) {
  const [selectedTaskKeys, setSelectedTaskKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [hiddenTaskKeys, setHiddenTaskKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const visibleTasks = tasks.filter((task) => !hiddenTaskKeys.has(taskKey(task)));
  const visibleTopTasks = visibleTasks.slice(0, 6);
  const selectedVisibleTasks = visibleTopTasks.filter((task) =>
    selectedTaskKeys.has(taskKey(task)),
  );
  const selectedCount = selectedVisibleTasks.length;
  const allVisibleSelected =
    visibleTopTasks.length > 0 && selectedCount === visibleTopTasks.length;

  useEffect(() => {
    setHiddenTaskKeys(readHiddenTodayTaskKeys());
  }, []);

  function toggleTaskSelection(task: TodoTask) {
    const key = taskKey(task);

    setSelectedTaskKeys((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  function toggleVisibleSelection() {
    setSelectedTaskKeys((current) => {
      const next = new Set(current);

      if (allVisibleSelected) {
        visibleTopTasks.forEach((task) => next.delete(taskKey(task)));
      } else {
        visibleTopTasks.forEach((task) => next.add(taskKey(task)));
      }

      return next;
    });
  }

  function clearSelection() {
    setSelectedTaskKeys(new Set());
  }

  function hideSelectedTasks() {
    const targetKeys = selectedVisibleTasks.map(taskKey);

    if (targetKeys.length === 0) {
      return;
    }

    setHiddenTaskKeys((current) => {
      const next = new Set(current);

      targetKeys.forEach((key) => next.add(key));
      writeHiddenTodayTaskKeys(next);

      return next;
    });
    clearSelection();
  }

  return (
    <Card id="todo" className="xl:row-span-2">
      <CardHeader>
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4" aria-hidden />
            <CardTitle>今日の次アクション</CardTitle>
            <Badge tone="red">{visibleTopTasks.length}</Badge>
          </div>
          <div className="flex overflow-hidden rounded-md border border-[#423c33]/55 text-xs font-semibold">
            <span className="bg-[#312d27] px-3 py-1.5 text-white">今日</span>
            <span className="px-3 py-1.5 text-[#70675b]">今週</span>
            <span className="px-3 py-1.5 text-[#70675b]">停滞</span>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 rounded-md border border-[#d8d1c4] bg-[#fffefa] p-2">
          <span className="mr-auto font-mono text-xs font-bold text-[#70675b]">
            selected {selectedCount}
          </span>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={toggleVisibleSelection}
            disabled={visibleTopTasks.length === 0}
          >
            {allVisibleSelected ? "表示中を解除" : "表示中を選択"}
          </Button>
          <Button
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={hideSelectedTasks}
            disabled={selectedCount === 0}
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            処理済み
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={hideSelectedTasks}
            disabled={selectedCount === 0}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            今日から外す
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={clearSelection}
            disabled={selectedCount === 0}
            aria-label="選択を解除"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-0 p-0">
        {visibleTopTasks.length === 0 && (
          <EmptyState
            title="未処理のタスクはありません"
            description="すべてのタスクが完了しています。"
            icon={CheckCircle2}
          />
        )}
        {visibleTopTasks.map((task, index) => {
          const key = taskKey(task);
          const isSelected = selectedTaskKeys.has(key);
          const taskHref = projectDetailHref(task.projectId, "progress");

          return (
            <div
              key={key}
              className={cn(
                "grid grid-cols-[24px_1fr] items-start gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 transition last:border-b-0 sm:grid-cols-[24px_1fr_auto]",
                isSelected ? "bg-[#f3f0e7]" : "hover:bg-[#fbfaf5]",
              )}
            >
              <label
                className="mt-0.5 flex h-5 w-5 cursor-pointer items-center justify-center"
                aria-label={`${task.title}を選択`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={isSelected}
                  onChange={() => toggleTaskSelection(task)}
                />
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border transition",
                    getTaskCheckboxClass(task),
                    isSelected && "border-[#312d27] bg-[#312d27] text-white",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3" aria-hidden />}
                </span>
              </label>
              <Link href={taskHref} className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#312d27]">
                  {task.title}
                </p>
                <p className="mt-1 font-mono text-xs text-[#8b8175]">
                  {index % 2 === 0 ? "10:00" : "14:00"} ・ {task.projectName}
                </p>
              </Link>
              <Link
                href={taskHref}
                className="col-start-2 w-fit sm:col-start-auto"
              >
                <Badge tone={getTaskBadgeTone(task)}>
                  {task.priority === "high"
                    ? "ブロッカー"
                    : task.priority === "medium"
                      ? "通常"
                      : "低"}
                </Badge>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function taskKey(task: TodoTask) {
  return `${task.projectId}:${task.id}`;
}

function getTaskCheckboxClass(task: TodoTask) {
  if (task.priority === "high") {
    return "border-[#c95d3a] bg-[#fbe4db]";
  }

  if (task.priority === "medium") {
    return "border-[#d2a528] bg-[#fff0a8]";
  }

  return "border-[#777066] bg-[#fffefa]";
}

function getTaskBadgeTone(task: TodoTask): "red" | "amber" | "blue" {
  if (task.priority === "high") {
    return "red";
  }

  return task.priority === "medium" ? "amber" : "blue";
}

function readHiddenTodayTaskKeys() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const rawValue = window.localStorage.getItem(getHiddenTodayTaskStorageKey());

    if (!rawValue) {
      return new Set<string>();
    }

    const parsed = JSON.parse(rawValue) as unknown;

    if (!Array.isArray(parsed)) {
      return new Set<string>();
    }

    return new Set(
      parsed.filter((value): value is string => typeof value === "string"),
    );
  } catch {
    return new Set<string>();
  }
}

function writeHiddenTodayTaskKeys(taskKeys: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      getHiddenTodayTaskStorageKey(),
      JSON.stringify([...taskKeys]),
    );
  } catch {
    // localStorage failure should not block today's task controls.
  }
}

function getHiddenTodayTaskStorageKey() {
  return `${hiddenTodayTaskStoragePrefix}${getTokyoDateKey()}`;
}

function getTokyoDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Tokyo",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";

  return `${year}-${month}-${day}`;
}
