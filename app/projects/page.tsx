"use client";

import { useMemo, useState } from "react";
import { ProjectTable } from "@/components/projects/project-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { statusMeta } from "@/components/project-status-badge";
import { projects } from "@/lib/mock-data";
import type { ProjectStatus } from "@/lib/types";
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

export default function ProjectsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    return projects.filter((p) => {
      const okStatus = filter === "all" || p.status === filter;
      const okKeyword =
        !keyword ||
        p.name.toLowerCase().includes(keyword.toLowerCase()) ||
        p.client.toLowerCase().includes(keyword.toLowerCase());
      return okStatus && okKeyword;
    });
  }, [filter, keyword]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
          PROJECTS
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-[#2f2b25]">
          案件一覧
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f665b]">
          すべての案件の進捗・最終更新日・収支・ステータスを確認できます。
          <strong>案件名の右にある「詳細」ボタン</strong>を押すと、案件ごとのタスクや議事録、ファイルが見られます。
        </p>
      </section>

      <section className="rounded-lg border border-[#d8d1c4] bg-[#fffefa] p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map((opt) => {
              const active = filter === opt.key;
              const count =
                opt.key === "all"
                  ? projects.length
                  : projects.filter((p) => p.status === opt.key).length;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setFilter(opt.key)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold transition",
                    active
                      ? "border-[#312d27] bg-[#312d27] text-white"
                      : "border-[#c8c0b4] bg-[#fbfaf5] text-[#5f574d] hover:bg-[#f3f0e7]",
                  )}
                >
                  {opt.label}
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
              placeholder="案件名・クライアント名で検索..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              aria-label="案件名・クライアント名で検索"
            />
          </label>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>
              {filter === "all"
                ? "管理中の案件"
                : `${statusMeta[filter as ProjectStatus].label}の案件`}
            </CardTitle>
            <p className="mt-1 text-sm text-[#81786d]">
              {visible.length}件を表示しています。
              {visible.length === 0 && " 条件に合う案件がありません。"}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {visible.length > 0 ? (
            <ProjectTable projects={visible} />
          ) : (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <p className="text-sm font-bold text-[#5f574d]">
                該当する案件がありません
              </p>
              <p className="text-xs text-[#81786d]">
                上のフィルタや検索条件を変えてもう一度お試しください。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
