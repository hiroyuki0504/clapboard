"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { statusMeta } from "@/components/project-status-badge";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn, safeDateTime } from "@/lib/utils";

type Filter = "all" | ProjectStatus;
type SortKey = "lastUpdated" | "dueDate" | "progress" | "blockers";
type Density = "comfortable" | "compact";
type BoardSettings = {
  filter: Filter;
  keyword: string;
  sortKey: SortKey;
  density: Density;
  showRisk: boolean;
};

const filterOptions: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "in-progress", label: "進行中" },
  { key: "review", label: "レビュー" },
  { key: "at-risk", label: "要注意" },
  { key: "planning", label: "計画中" },
  { key: "completed", label: "完了" },
];

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "lastUpdated", label: "更新が新しい" },
  { key: "dueDate", label: "節目が近い" },
  { key: "progress", label: "進捗が高い" },
  { key: "blockers", label: "停滞が多い" },
];

const defaultBoardSettings: BoardSettings = {
  filter: "all",
  keyword: "",
  sortKey: "lastUpdated",
  density: "comfortable",
  showRisk: true,
};

export function ProjectBoardClient({
  projects,
  dataSourceLabel,
}: {
  projects: Project[];
  dataSourceLabel: string;
}) {
  const [settings, setSettings] =
    useState<BoardSettings>(defaultBoardSettings);
  const { filter, keyword, sortKey, density, showRisk } = settings;
  const hasCustomSettings = hasCustomBoardSettings(settings);

  useEffect(() => {
    function syncSettingsFromUrl() {
      setSettings(readBoardSettingsFromUrl());
    }

    syncSettingsFromUrl();
    window.addEventListener("popstate", syncSettingsFromUrl);

    return () => window.removeEventListener("popstate", syncSettingsFromUrl);
  }, []);

  const visible = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesStatus = filter === "all" || project.status === filter;
        const matchesKeyword =
          !normalizedKeyword ||
          getProjectSearchText(project).includes(normalizedKeyword);

        return matchesStatus && matchesKeyword;
      })
      .sort((a, b) => compareProjects(a, b, sortKey));
  }, [filter, keyword, projects, sortKey]);

  function updateSettings(nextSettings: Partial<BoardSettings>) {
    setSettings((current) => {
      const updated = { ...current, ...nextSettings };
      replaceBoardUrl(updated);
      return updated;
    });
  }

  return (
    <>
      <section className="rounded-lg border border-[#d8d1c4] bg-[#fffefa] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((option) => {
              const active = filter === option.key;
              const count =
                option.key === "all"
                  ? projects.length
                  : projects.filter((project) => project.status === option.key)
                      .length;

              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => updateSettings({ filter: option.key })}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    active
                      ? "border-[#312d27] bg-[#312d27] text-white"
                      : "border-[#c8c0b4] bg-[#fbfaf5] text-[#5f574d] hover:bg-[#f3f0e7]",
                  )}
                >
                  {option.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px]",
                      active ? "bg-white/15 text-white" : "bg-[#e8e2d3] text-[#70675b]",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <label className="flex h-10 w-full max-w-sm items-center gap-2 rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm">
            <Search className="h-4 w-4 shrink-0 text-[#8b8175]" aria-hidden />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9a9084]"
              placeholder="ワーク名・クライアント・担当者・タスクで検索..."
              value={keyword}
              onChange={(event) =>
                updateSettings({ keyword: event.target.value })
              }
              aria-label="ワーク名・クライアント・担当者・タスクで検索"
              type="search"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-col gap-3 border-t border-dashed border-[#d8d1c4] pt-3 sm:flex-row sm:items-center sm:justify-end">
          <label className="sr-only" htmlFor="project-sort-key">
            並び替え
          </label>
          <select
            id="project-sort-key"
            className="h-10 rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm font-semibold text-[#312d27] outline-none"
            value={sortKey}
            onChange={(event) => {
              if (isSortKey(event.target.value)) {
                updateSettings({ sortKey: event.target.value });
              }
            }}
          >
            {sortOptions.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            className="h-10 rounded-md px-3"
            aria-pressed={density === "compact"}
            onClick={() =>
              updateSettings({
                density: density === "comfortable" ? "compact" : "comfortable",
              })
            }
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {density === "comfortable" ? "コンパクト表示" : "標準表示"}
          </Button>
          <label className="flex h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm font-semibold text-[#312d27]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#c95d3a]"
              checked={showRisk}
              onChange={(event) =>
                updateSettings({ showRisk: event.target.checked })
              }
            />
            リスク列を表示
          </label>
          <Button
            variant="secondary"
            className="h-10 rounded-md px-3"
            onClick={() => updateSettings(defaultBoardSettings)}
            disabled={!hasCustomSettings}
          >
            表示をリセット
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {filter === "all"
                ? "進行中ワークストリーム"
                : `${statusMeta[filter].label}のワークストリーム`}
            </CardTitle>
            <p className="mt-1 text-sm text-[#81786d]">
              {visible.length}件の{dataSourceLabel}データを表示しています。
              {visible.length === 0 && " 条件に合うワークはありません。"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {visible.length > 0 ? (
            <ProjectTable
              projects={visible}
              density={density}
              showRisk={showRisk}
            />
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <p className="text-sm font-bold text-[#5f574d]">
                該当するワークストリームがありません
              </p>
              <p className="text-xs text-[#81786d]">
                上のフィルタや検索条件を変えてもう一度お試しください。
              </p>
              {hasCustomSettings && (
                <Button
                  variant="secondary"
                  className="mt-2 h-9 rounded-md px-3"
                  onClick={() => updateSettings(defaultBoardSettings)}
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  条件をリセット
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function isFilter(value: string | null): value is Filter {
  return filterOptions.some((option) => option.key === value);
}

function isSortKey(value: string | null): value is SortKey {
  return sortOptions.some((option) => option.key === value);
}

function isDensity(value: string | null): value is Density {
  return value === "comfortable" || value === "compact";
}

function readBoardSettingsFromUrl(): BoardSettings {
  if (typeof window === "undefined") {
    return defaultBoardSettings;
  }

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const sort = params.get("sort");
  const density = params.get("density");

  return {
    filter: isFilter(status) ? status : defaultBoardSettings.filter,
    keyword: params.get("q") ?? defaultBoardSettings.keyword,
    sortKey: isSortKey(sort) ? sort : defaultBoardSettings.sortKey,
    density: isDensity(density) ? density : defaultBoardSettings.density,
    showRisk: params.get("risk") !== "hidden",
  };
}

function replaceBoardUrl(settings: BoardSettings) {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  setDefaultableSearchParam(
    url.searchParams,
    "status",
    settings.filter,
    defaultBoardSettings.filter,
  );
  setDefaultableSearchParam(
    url.searchParams,
    "q",
    settings.keyword.trim(),
    defaultBoardSettings.keyword,
  );
  setDefaultableSearchParam(
    url.searchParams,
    "sort",
    settings.sortKey,
    defaultBoardSettings.sortKey,
  );
  setDefaultableSearchParam(
    url.searchParams,
    "density",
    settings.density,
    defaultBoardSettings.density,
  );

  if (settings.showRisk) {
    url.searchParams.delete("risk");
  } else {
    url.searchParams.set("risk", "hidden");
  }

  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function setDefaultableSearchParam(
  params: URLSearchParams,
  name: string,
  value: string,
  defaultValue: string,
) {
  if (value === defaultValue) {
    params.delete(name);
  } else {
    params.set(name, value);
  }
}

function hasCustomBoardSettings(settings: BoardSettings) {
  return (
    settings.filter !== defaultBoardSettings.filter ||
    settings.keyword.trim() !== defaultBoardSettings.keyword ||
    settings.sortKey !== defaultBoardSettings.sortKey ||
    settings.density !== defaultBoardSettings.density ||
    settings.showRisk !== defaultBoardSettings.showRisk
  );
}

function getProjectSearchText(project: Project) {
  return [
    project.name,
    project.client,
    project.owner,
    project.summary,
    ...project.tasks.flatMap((task) => [task.title, task.note]),
    ...project.updates.map((update) => update.text),
    ...project.minutes.flatMap((minute) => [
      minute.title,
      minute.participants.join(" "),
    ]),
  ]
    .join(" ")
    .toLowerCase();
}

function compareProjects(a: Project, b: Project, sortKey: SortKey) {
  if (sortKey === "dueDate") {
    return (
      safeDateTime(a.dueDate, Number.POSITIVE_INFINITY) -
      safeDateTime(b.dueDate, Number.POSITIVE_INFINITY)
    );
  }

  if (sortKey === "progress") {
    return b.progress - a.progress;
  }

  if (sortKey === "blockers") {
    return (
      getHighPriorityOpenTaskCount(b.tasks) -
      getHighPriorityOpenTaskCount(a.tasks)
    );
  }

  return safeDateTime(b.lastUpdated, 0) - safeDateTime(a.lastUpdated, 0);
}
