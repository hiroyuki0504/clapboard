import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, Bot, CalendarDays } from "lucide-react";
import Link from "next/link";
import { ProjectDetailTabs } from "@/components/projects/project-detail-tabs";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProject } from "@/lib/clapboard-api";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const projectResult = await getProject(id);
  if (projectResult.error) {
    if (projectResult.error.status === 404) {
      notFound();
    }
    throw new Error(projectResult.error.message);
  }

  const project = projectResult.data;

  if (!project) {
    notFound();
  }

  const openTasks = project.tasks.filter((task) => !task.completed);
  const blockerCount = openTasks.filter(
    (task) => task.priority === "high",
  ).length;

  return (
    <div className="space-y-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#70675b] transition hover:text-[#312d27]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        進捗一覧へ戻る
      </Link>

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="border-b border-[#d8d1c4] bg-[#fffefa] px-5 py-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <ProjectStatusBadge status={project.status} />
              <span className="text-sm font-semibold text-[#70675b]">
                {project.owner}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
              {project.name}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f574d]">
              {project.summary}
            </p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <SummaryItem
              label="進捗率"
              value={`${project.progress}%`}
              body={<Progress value={project.progress} className="mt-3" />}
            />
            <SummaryItem
              label="次の節目"
              value={formatDate(project.dueDate)}
              body={
                <div className="mt-3 flex items-center gap-2 text-sm text-[#70675b]">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  更新 {formatDate(project.lastUpdated)}
                </div>
              }
            />
            <SummaryItem
              label="未完了タスク"
              value={`${openTasks.length}件`}
              body={
                <div
                  className={`mt-3 flex items-center gap-2 text-sm ${
                    blockerCount > 0 ? "text-[#9a4a31]" : "text-[#5f8b5b]"
                  }`}
                >
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  {blockerCount > 0
                    ? `ブロッカー ${blockerCount}件`
                    : "ブロッカーなし"}
                </div>
              }
            />
          </div>
        </Card>

        <Card className="bg-[#221d38] p-5 text-white">
          <div className="flex items-center gap-2 text-sm font-bold text-[#a9d2a4]">
            <Bot className="h-4 w-4" aria-hidden />
            Progress Agent Link
          </div>
          <h3 className="mt-3 text-xl font-black tracking-normal">
            AI補助の接続状態
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#d8d0c6]">
            議事録から次アクションを抽出し、進捗率、停滞理由、次の節目を自動更新する想定です。
          </p>
          <div className="mt-5 rounded-md border border-white/15 bg-white/8 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#bdb5ad]">
              Agent Status
            </p>
            <p className="mt-2 text-sm font-bold">
              Connected / {projectResult.connected ? "Backend API" : "Local API"}
            </p>
          </div>
          <div className="mt-4 rounded-sm border border-[#d2a528] bg-[#ffe783] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415]">
            進捗データはAPIデータ層経由で取得しています。
          </div>
        </Card>
      </section>

      <ProjectDetailTabs project={project} />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  body,
}: {
  label: string;
  value: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black tracking-normal text-[#312d27]">
        {value}
      </p>
      {body}
    </div>
  );
}
