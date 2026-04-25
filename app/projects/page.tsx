import { Badge } from "@/components/ui/badge";
import { ProjectBoardClient } from "@/components/projects/project-board-client";
import { getProjects } from "@/lib/clapboard-api";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

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
            行の「開く」から詳細画面に移動できます。
          </p>
        </div>
        <Badge tone={projectsResult.connected ? "green" : "amber"}>
          {projectsResult.connected ? "Backend API" : "Local API"}
        </Badge>
      </section>

      <ProjectBoardClient
        projects={projects}
        dataSourceLabel={projectsResult.connected ? "API連携" : "ローカルAPI"}
      />
    </div>
  );
}
