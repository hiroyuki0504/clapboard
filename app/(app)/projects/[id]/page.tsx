import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CalendarDays,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { ProjectDetailTabs } from "@/components/projects/project-detail-tabs";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProject } from "@/lib/clapboard-api";
import {
  getHighPriorityOpenTaskCount,
  getOpenTasks,
  getProjectBudgetBalance,
} from "@/lib/project-selectors";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;
  const initialTab = Array.isArray(tab) ? tab[0] : tab;
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

  const openTasks = getOpenTasks(project.tasks);
  const blockerCount = getHighPriorityOpenTaskCount(project.tasks);
  const budgetBalance = getProjectBudgetBalance(project);

  return (
    <div className="space-y-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm font-bold text-[#70675b] transition hover:border-[#d8d1c4] hover:bg-[#fffefa] hover:text-[#312d27]"
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
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
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
            <SummaryItem
              label="予算余力"
              value={formatCurrency(budgetBalance)}
              body={
                <div className="mt-3 flex items-center gap-2 text-sm text-[#5f8b5b]">
                  <CircleDollarSign className="h-4 w-4" aria-hidden />
                  予算 {formatCurrency(project.revenue)}
                </div>
              }
            />
          </div>
        </Card>

        <Card className="bg-[#221d38] p-5 text-white">
          <div className="flex items-center gap-2 text-sm font-bold text-[#a9d2a4]">
            <Bot className="h-4 w-4" aria-hidden />
            この画面でできること
          </div>
          <h3 className="mt-3 text-xl font-black tracking-normal">
            進捗の中身を 1 か所で確認
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-[#d8d0c6]">
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>下のタブで、概要・タスク・議事録・予算・ファイルを切り替えます。</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>ファイルタブでは安全な外部URLだけをクリック可能にしています。</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>進捗データは {projectResult.connected ? "Backend API" : "Local API"} 経由で取得しています。</span>
            </li>
          </ul>
        </Card>
      </section>

      <ProjectDetailTabs project={project} initialTab={initialTab} />
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
