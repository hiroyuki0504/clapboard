import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";
import type { Project, ProjectStatus } from "@/lib/types";
import { safeDateTime } from "@/lib/utils";

export type BoardFilter = "all" | ProjectStatus;
export type BoardSortKey = "lastUpdated" | "dueDate" | "progress" | "blockers";
export type BoardDensity = "comfortable" | "compact";

export type BoardSettings = {
  filter: BoardFilter;
  keyword: string;
  sortKey: BoardSortKey;
  density: BoardDensity;
  showRisk: boolean;
};

export const boardFilterOptions: { key: BoardFilter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "in-progress", label: "進行中" },
  { key: "review", label: "レビュー" },
  { key: "at-risk", label: "要注意" },
  { key: "planning", label: "計画中" },
  { key: "completed", label: "完了" },
];

export const boardSortOptions: { key: BoardSortKey; label: string }[] = [
  { key: "lastUpdated", label: "更新が新しい" },
  { key: "dueDate", label: "節目が近い" },
  { key: "progress", label: "進捗が高い" },
  { key: "blockers", label: "停滞が多い" },
];

export const defaultBoardSettings: BoardSettings = {
  filter: "all",
  keyword: "",
  sortKey: "lastUpdated",
  density: "comfortable",
  showRisk: true,
};

export function isBoardFilter(value: string | null): value is BoardFilter {
  return boardFilterOptions.some((option) => option.key === value);
}

export function isBoardSortKey(value: string | null): value is BoardSortKey {
  return boardSortOptions.some((option) => option.key === value);
}

export function isBoardDensity(value: string | null): value is BoardDensity {
  return value === "comfortable" || value === "compact";
}

export function readBoardSettingsFromUrl(): BoardSettings {
  if (typeof window === "undefined") {
    return defaultBoardSettings;
  }

  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const sort = params.get("sort");
  const density = params.get("density");

  return {
    filter: isBoardFilter(status) ? status : defaultBoardSettings.filter,
    keyword: params.get("q") ?? defaultBoardSettings.keyword,
    sortKey: isBoardSortKey(sort) ? sort : defaultBoardSettings.sortKey,
    density: isBoardDensity(density) ? density : defaultBoardSettings.density,
    showRisk: params.get("risk") !== "hidden",
  };
}

export function replaceBoardUrl(settings: BoardSettings) {
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

export function hasCustomBoardSettings(settings: BoardSettings) {
  return (
    settings.filter !== defaultBoardSettings.filter ||
    settings.keyword.trim() !== defaultBoardSettings.keyword ||
    settings.sortKey !== defaultBoardSettings.sortKey ||
    settings.density !== defaultBoardSettings.density ||
    settings.showRisk !== defaultBoardSettings.showRisk
  );
}

export function getProjectSearchText(project: Project) {
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

export function compareProjects(a: Project, b: Project, sortKey: BoardSortKey) {
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
