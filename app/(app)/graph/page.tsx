import {
  ArrowRight,
  CircleDot,
  FileText,
  GitBranch,
  ListFilter,
  Network,
  TimerReset,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProjects } from "@/lib/clapboard-api";
import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";
import type { Project } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

type GraphNode = {
  id: string;
  label: string;
  sub: string;
  tone: "project" | "task" | "file" | "minute" | "support";
  x: number;
  y: number;
  href?: string;
};

type GraphEdge = {
  from: string;
  to: string;
};

const toneClass = {
  project: "border-[#d66b43] text-[#9a4a31]",
  task: "border-[#423c33] text-[#312d27]",
  file: "border-[#8aa0b8] text-[#315a78]",
  minute: "border-[#b89b48] text-[#7c5a18]",
  support: "border-[#93aa8d] text-[#426c3d]",
};

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
            <div className="flex shrink-0 overflow-hidden rounded-md border border-[#423c33]/55 text-sm font-bold">
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
            <div className="thin-scrollbar overflow-x-auto">
              <div className="dotted-canvas relative min-h-[520px] min-w-[680px] bg-[#fffefa]">
                <svg
                  className="absolute inset-0 h-full w-full"
                  viewBox="0 0 1000 520"
                  role="img"
                  aria-label="ワーク、タスク、議事録、ファイルの関係線"
                >
                  {model.edges.map((edge) => {
                    const from = model.nodeById.get(edge.from);
                    const to = model.nodeById.get(edge.to);
                    if (!from || !to) return null;

                    return (
                      <line
                        key={`${edge.from}-${edge.to}`}
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke="#c8c0b4"
                        strokeWidth="2"
                      />
                    );
                  })}
                </svg>

                {model.nodes.map((node) => {
                  const body = (
                    <div
                      className={`absolute z-10 w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border bg-[#fffefa] px-3 py-2 shadow-sm ${toneClass[node.tone]}`}
                      style={{
                        left: `${node.x / 10}%`,
                        top: `${node.y / 5.2}%`,
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <CircleDot className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="min-w-0 truncate text-sm font-black">
                          {node.label}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-[#81786d]">
                        {node.sub}
                      </p>
                    </div>
                  );

                  if (!node.href) {
                    return <div key={node.id}>{body}</div>;
                  }

                  return (
                    <Link
                      key={node.id}
                      href={node.href}
                      aria-label={`${node.label}を開く`}
                    >
                      {body}
                    </Link>
                  );
                })}

                <div className="absolute bottom-6 left-6 max-w-xs rotate-[-1deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-4 py-3 text-sm font-bold leading-6 text-[#6f5415] shadow-sm">
                  赤枠は停滞リスク。線はワーク、タスク、議事録、ファイルの参照関係です。
                </div>
              </div>
            </div>
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

function buildGraphModel(projects: Project[]) {
  const focus = [...projects].sort(
    (a, b) =>
      getHighPriorityOpenTaskCount(b.tasks) -
        getHighPriorityOpenTaskCount(a.tasks) ||
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )[0];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (focus) {
    nodes.push({
      id: focus.id,
      label: focus.name,
      sub: `${focus.progress}% / ${focus.client}`,
      tone: "project",
      x: 170,
      y: 150,
      href: `/projects/${focus.id}`,
    });

    const blocker = focus.tasks.find(
      (task) => !task.completed && task.priority === "high",
    );
    if (blocker) {
      nodes.push({
        id: blocker.id,
        label: blocker.title,
        sub: "高優先度タスク",
        tone: "task",
        x: 455,
        y: 280,
        href: `/projects/${focus.id}?tab=progress`,
      });
      edges.push({ from: focus.id, to: blocker.id });
    }

    const minute = focus.minutes[0];
    if (minute) {
      nodes.push({
        id: minute.id,
        label: minute.title,
        sub: "議事録",
        tone: "minute",
        x: 590,
        y: 120,
        href: `/projects/${focus.id}?tab=minutes`,
      });
      edges.push({ from: focus.id, to: minute.id });
    }

    const file = focus.files[0];
    if (file) {
      nodes.push({
        id: file.id,
        label: file.name,
        sub: file.type.toUpperCase(),
        tone: "file",
        x: 785,
        y: 250,
        href: `/projects/${focus.id}?tab=files`,
      });
      edges.push({ from: minute?.id ?? focus.id, to: file.id });
      if (blocker) edges.push({ from: blocker.id, to: file.id });
    }
  }

  projects
    .filter((project) => project.id !== focus?.id)
    .slice(0, 2)
    .forEach((project, index) => {
      nodes.push({
        id: project.id,
        label: project.name,
        sub: `${project.progress}% / ${project.client}`,
        tone: "support",
        x: index === 0 ? 300 : 720,
        y: index === 0 ? 410 : 390,
        href: `/projects/${project.id}`,
      });
      if (focus) {
        edges.push({ from: focus.id, to: project.id });
      }
    });

  return {
    focus,
    nodes,
    edges,
    nodeById: new Map(nodes.map((node) => [node.id, node])),
  };
}
