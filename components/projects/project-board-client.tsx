"use client";

import { RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { statusMeta } from "@/components/project-status-badge";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type BoardSettings,
  boardFilterOptions,
  boardSortOptions,
  compareProjects,
  defaultBoardSettings,
  getProjectSearchText,
  hasCustomBoardSettings,
  isBoardSortKey,
  readBoardSettingsFromUrl,
  replaceBoardUrl,
} from "@/lib/board-settings";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

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
            {boardFilterOptions.map((option) => {
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
        <div className="mt-3 flex flex-col gap-3 border-t border-dashed border-[#d8d1c4] pt-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
          <label className="sr-only" htmlFor="project-sort-key">
            並び替え
          </label>
          <select
            id="project-sort-key"
            className="h-10 rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm font-semibold text-[#312d27] outline-none"
            value={sortKey}
            onChange={(event) => {
              if (isBoardSortKey(event.target.value)) {
                updateSettings({ sortKey: event.target.value });
              }
            }}
          >
            {boardSortOptions.map((option) => (
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
