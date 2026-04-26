import {
  ArrowRight,
  FileText,
  GitBranch,
  ListFilter,
  Network,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { GraphCanvas } from "@/components/graph/graph-canvas";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects } from "@/lib/clapboard-api";
import { buildGraphModel } from "@/lib/graph-model";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GraphPage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const projects = projectsResult.data;
  const model = buildGraphModel(projects);
  const focus = model.focus;
  const highPriorityTasks = projects.flatMap((project) =>
    project.tasks
      .filter((task) => !task.completed && task.priority === "high")
      .map((task) => ({
        ...task,
        projectId: project.id,
        projectName: project.name,
      })),
  );
  const recentFiles = projects
    .flatMap((project) =>
      project.files.map((file) => ({ ...file, projectName: project.name })),
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            GRAPH VIEW
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                ワークとファイルの関係グラフ
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                停滞タスク、進捗メモ、関連ファイルを同じ面に置いて、次に確認すべき依存関係を追います。
              </p>
            </div>
            <div className="thin-scrollbar flex w-full overflow-x-auto rounded-md border border-[#423c33]/55 text-sm font-bold sm:w-auto sm:shrink-0">
              <span className="inline-flex items-center gap-2 bg-[#312d27] px-3 py-2 text-white">
                <Network className="h-4 w-4" aria-hidden />
                グラフ
              </span>
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-3 py-2 text-[#70675b] transition hover:bg-[#f6f1e7] hover:text-[#312d27]"
              >
                <ListFilter className="h-4 w-4" aria-hidden />
                リスト
              </Link>
              <Link
                href="/timeline"
                className="inline-flex items-center gap-2 px-3 py-2 text-[#70675b] transition hover:bg-[#f6f1e7] hover:text-[#312d27]"
              >
                <TimerReset className="h-4 w-4" aria-hidden />
                タイムライン
              </Link>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" aria-hidden />
              <CardTitle>フォーカス</CardTitle>
            </div>
            <Badge tone="red">{highPriorityTasks.length} blockers</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-black text-[#312d27]">
              {focus?.name ?? "ワークがありません"}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#70675b]">
              {focus?.summary ?? "表示できる関係データがまだありません。"}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Network className="h-4 w-4" aria-hidden />
              <CardTitle>関係マップ</CardTitle>
            </div>
            <span className="text-xs text-[#81786d]">
              {model.nodes.length} nodes / {model.edges.length} edges
            </span>
          </CardHeader>
          <CardContent className="p-0">
            <GraphCanvas model={model} />
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>停滞タスク</CardTitle>
              <span className="text-xs text-[#81786d]">priority high</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {highPriorityTasks.slice(0, 5).map((task) => (
                <Link
                  key={`${task.projectId}-${task.id}`}
                  href={`/projects/${task.projectId}?tab=progress`}
                  className="block rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3 transition hover:border-[#c95d3a] hover:bg-[#fffefa]"
                >
                  <p className="text-sm font-bold text-[#312d27]">{task.title}</p>
                  <p className="mt-1 text-xs text-[#81786d]">{task.projectName}</p>
                </Link>
              ))}
              {highPriorityTasks.length === 0 && (
                <p className="text-sm text-[#70675b]">高優先度の未完了タスクはありません。</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" aria-hidden />
                <CardTitle>最近のファイル</CardTitle>
              </div>
              <span className="text-xs text-[#81786d]">{recentFiles.length}件</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentFiles.slice(0, 4).map((file) => (
                <div
                  key={`${file.projectName}-${file.id}`}
                  className="grid grid-cols-[1fr_auto] gap-3 border-b border-dashed border-[#d8d1c4] pb-3 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#312d27]">
                      {file.name}
                    </p>
                    <p className="mt-1 truncate text-xs text-[#81786d]">
                      {file.projectName}
                    </p>
                  </div>
                  <span className="text-xs text-[#81786d]">
                    {formatDateTime(file.updatedAt)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <ButtonLink href="/command" className="justify-between">
            AIに整理を依頼する
            <ArrowRight className="h-4 w-4" aria-hidden />
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
