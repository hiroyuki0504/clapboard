import { Filter, Plus, SlidersHorizontal } from "lucide-react";
import { ProjectTable } from "@/components/projects/project-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects } from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projectsResult = await getProjects();
  const projects = projectsResult.data;

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            PROGRESS BOARD
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-normal text-[#2f2b25]">
            進捗一覧
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f665b]">
            ワークストリームごとの進捗率、次の節目、停滞リスク、未完了タスクを横断して確認できます。
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
            進捗追加
          </Button>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>進行中ワークストリーム</CardTitle>
            <p className="mt-1 text-sm text-[#81786d]">
              {projects.length}件の
              {projectsResult.connected ? "API連携" : "ローカルAPI"}データを表示しています。
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <ProjectTable projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
