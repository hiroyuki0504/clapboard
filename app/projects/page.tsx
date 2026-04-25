"use client";

import { Filter, Plus, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projects } from "@/lib/mock-data";
import { readProjectsWithSnapshots } from "@/lib/project-persistence";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projectList, setProjectList] = useState<Project[]>(projects);

  useEffect(() => {
    setProjectList(readProjectsWithSnapshots(projects));
  }, []);

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
          <Button variant="secondary">
            <Filter className="h-4 w-4" aria-hidden />
            フィルタ
          </Button>
          <Button variant="secondary">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            表示設定
          </Button>
          <Button>
            <Plus className="h-4 w-4" aria-hidden />
            新規案件
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>管理中の案件</CardTitle>
            <p className="mt-1 text-sm text-[#81786d]">
              {projectList.length}件のモック案件を表示しています。
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ProjectTable projects={projectList} />
        </CardContent>
      </Card>
    </div>
  );
}
