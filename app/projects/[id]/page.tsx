import { notFound } from "next/navigation";
import { ArrowLeft, Bot, CalendarDays, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { ProjectDetailTabs } from "@/components/projects/project-detail-tabs";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { getProjectById, projects } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProjectById(id);

  if (!project) {
    notFound();
  }

  const profit = project.revenue - project.cost;

  return (
    <div className="space-y-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 rounded-md border border-transparent px-2 py-1 text-sm font-bold text-[#70675b] transition hover:border-[#d8d1c4] hover:bg-[#fffefa] hover:text-[#312d27]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        案件一覧に戻る
      </Link>

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="border-b border-[#d8d1c4] bg-[#fffefa] px-5 py-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <ProjectStatusBadge status={project.status} />
              <span className="text-sm font-semibold text-[#70675b]">
                {project.client}
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
              label="期限"
              value={formatDate(project.dueDate)}
              body={
                <div className="mt-3 flex items-center gap-2 text-sm text-[#70675b]">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  最終更新 {formatDate(project.lastUpdated)}
                </div>
              }
            />
            <SummaryItem
              label="収支"
              value={formatCurrency(profit)}
              body={
                <div className="mt-3 flex items-center gap-2 text-sm text-[#5f8b5b]">
                  <CircleDollarSign className="h-4 w-4" aria-hidden />
                  売上 {formatCurrency(project.revenue)}
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
          <h3 className="mt-3 text-lg font-black tracking-normal">
            案件のすべてを 1 か所で
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm leading-6 text-[#d8d0c6]">
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>下のタブを切り替えると、タスク・議事録・収支・ファイルを確認できます。</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>ファイルタブからは Google Drive のリンクを開けます。</span>
            </li>
            <li className="flex gap-2">
              <span aria-hidden>•</span>
              <span>左上の「案件一覧に戻る」で他の案件に切り替わります。</span>
            </li>
          </ul>
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
