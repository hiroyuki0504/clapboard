"use client";

import { Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/lib/mock-data";
import { readProjectsWithSnapshots } from "@/lib/project-persistence";
import type { Project } from "@/lib/types";

type ProjectStatusFilter = "all" | Project["status"];
type ProjectSortKey = "lastUpdated" | "dueDate" | "progress" | "profit";
type ProjectDensity = "comfortable" | "compact";

const statusOptions: { value: ProjectStatusFilter; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "planning", label: "計画中" },
  { value: "in-progress", label: "進行中" },
  { value: "review", label: "レビュー" },
  { value: "at-risk", label: "要注意" },
  { value: "completed", label: "完了" },
];

const sortOptions: { value: ProjectSortKey; label: string }[] = [
  { value: "lastUpdated", label: "最終更新が新しい" },
  { value: "dueDate", label: "期限が近い" },
  { value: "progress", label: "進捗が高い" },
  { value: "profit", label: "収支が大きい" },
];

export default function ProjectsPage() {
  const [projectList, setProjectList] = useState<Project[]>(projects);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<ProjectStatusFilter>("all");
  const [sortKey, setSortKey] = useState<ProjectSortKey>("lastUpdated");
  const [density, setDensity] = useState<ProjectDensity>("comfortable");
  const [showFinancials, setShowFinancials] = useState(true);

  useEffect(() => {
    setProjectList(readProjectsWithSnapshots(projects));
  }, []);

  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");

    if (isProjectStatusFilter(status)) {
      setStatusFilter(status);
    }
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleProjects = projectList
    .filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return [
        project.name,
        project.client,
        project.owner,
        project.summary,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    })
    .sort((a, b) => compareProjects(a, b, sortKey));
  const activeCount = projectList.filter(
    (project) => project.status !== "completed",
  ).length;
  const reviewCount = projectList.filter(
    (project) => project.status === "review",
  ).length;

  function handleStatusFilterChange(value: ProjectStatusFilter) {
    setStatusFilter(value);

    const url = new URL(window.location.href);

    if (value === "all") {
      url.searchParams.delete("status");
    } else {
      url.searchParams.set("status", value);
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            PROJECTS
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-normal text-[#2f2b25]">
            案件一覧
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f665b]">
            進捗、最終更新、収支、ステータスを横断して確認できます。詳細画面から議事録・ファイル・タスクを管理します。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => handleStatusFilterChange("review")}
          >
            <Filter className="h-4 w-4" aria-hidden />
            レビューのみ
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              setDensity((current) =>
                current === "comfortable" ? "compact" : "comfortable",
              )
            }
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {density === "comfortable" ? "コンパクト表示" : "標準表示"}
          </Button>
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            新規案件
          </Button>
        </div>
      </section>

      <Card>
        <CardContent
          id="project-controls"
          className="grid gap-3 p-4 lg:grid-cols-[minmax(240px,1fr)_180px_190px_auto]"
        >
          <label className="flex h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm text-[#8b8175]">
            <Search className="h-4 w-4" aria-hidden />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9a9084]"
              placeholder="案件名・クライアント・担当で検索"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>

          <label className="sr-only" htmlFor="project-status-filter">
            ステータス
          </label>
          <select
            id="project-status-filter"
            className="h-10 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm font-semibold text-[#312d27] outline-none"
            value={statusFilter}
            onChange={(event) =>
              handleStatusFilterChange(event.target.value as ProjectStatusFilter)
            }
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="project-sort-key">
            並び替え
          </label>
          <select
            id="project-sort-key"
            className="h-10 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm font-semibold text-[#312d27] outline-none"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as ProjectSortKey)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="flex h-10 items-center gap-2 rounded-md border border-[#c8c0b4] bg-[#fffefa] px-3 text-sm font-semibold text-[#312d27]">
            <input
              type="checkbox"
              className="h-4 w-4 accent-[#c95d3a]"
              checked={showFinancials}
              onChange={(event) => setShowFinancials(event.target.checked)}
            />
            収支列を表示
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>管理中の案件</CardTitle>
            <p className="mt-1 text-sm text-[#81786d]">
              {projectList.length}件中 {visibleProjects.length}件を表示中。
              進行中 {activeCount}件、レビュー {reviewCount}件。
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ProjectTable
            projects={visibleProjects}
            density={density}
            showFinancials={showFinancials}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function isProjectStatusFilter(value: string | null): value is ProjectStatusFilter {
  return statusOptions.some((option) => option.value === value);
}

function compareProjects(
  a: Project,
  b: Project,
  sortKey: ProjectSortKey,
) {
  if (sortKey === "dueDate") {
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  }

  if (sortKey === "progress") {
    return b.progress - a.progress;
  }

  if (sortKey === "profit") {
    return getProfit(b) - getProfit(a);
  }

  return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
}

function getProfit(project: Project) {
  return project.revenue - project.cost;
}
