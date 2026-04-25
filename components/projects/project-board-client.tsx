"use client";

import { useMemo, useState } from "react";
import { statusMeta } from "@/components/project-status-badge";
import { ProjectTable } from "@/components/projects/project-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project, ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Filter = "all" | ProjectStatus;

const filterOptions: { key: Filter; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "in-progress", label: "進行中" },
  { key: "review", label: "レビュー" },
  { key: "at-risk", label: "要注意" },
  { key: "planning", label: "計画中" },
  { key: "completed", label: "完了" },
];

export function ProjectBoardClient({
  projects,
  dataSourceLabel,
}: {
  projects: Project[];
  dataSourceLabel: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesStatus = filter === "all" || project.status === filter;
      const matchesKeyword =
        !normalizedKeyword ||
        project.name.toLowerCase().includes(normalizedKeyword) ||
        project.client.toLowerCase().includes(normalizedKeyword) ||
        project.owner.toLowerCase().includes(normalizedKeyword);

      return matchesStatus && matchesKeyword;
    });
  }, [filter, keyword, projects]);

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
                  onClick={() => setFilter(option.key)}
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
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9a9084]"
              placeholder="ワーク名・クライアント・担当者で検索..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              aria-label="ワーク名・クライアント・担当者で検索"
            />
          </label>
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
            <ProjectTable projects={visible} />
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <p className="text-sm font-bold text-[#5f574d]">
                該当するワークストリームがありません
              </p>
              <p className="text-xs text-[#81786d]">
                上のフィルタや検索条件を変えてもう一度お試しください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
