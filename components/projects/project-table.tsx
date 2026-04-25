import { ArrowUpRight, CircleDollarSign } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import type { Project } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-0">
        <thead>
          <tr className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
            <th scope="col" className="px-5 py-4">
              案件名
            </th>
            <th scope="col" className="px-5 py-4">
              クライアント
            </th>
            <th scope="col" className="px-5 py-4">
              ステータス
            </th>
            <th scope="col" className="px-5 py-4">
              進捗
            </th>
            <th scope="col" className="px-5 py-4">
              最終更新
            </th>
            <th scope="col" className="px-5 py-4">
              収支
            </th>
            <th scope="col" className="px-5 py-4 text-right">
              詳細を見る
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const profit = project.revenue - project.cost;
            const positive = profit >= 0;

            return (
              <tr
                key={project.id}
                className="group transition hover:bg-[#fbfaf5]"
              >
                <td className="border-t border-[#ded6ca] px-5 py-4">
                  <div>
                    <p className="font-bold text-[#312d27]">{project.name}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-[#70675b]">
                      {project.summary}
                    </p>
                  </div>
                </td>
                <td className="border-t border-[#ded6ca] px-5 py-4 text-sm text-[#70675b]">
                  {project.client}
                </td>
                <td className="border-t border-[#ded6ca] px-5 py-4">
                  <ProjectStatusBadge status={project.status} />
                </td>
                <td className="border-t border-[#ded6ca] px-5 py-4">
                  <div className="flex min-w-36 items-center gap-3">
                    <Progress value={project.progress} />
                    <span className="w-10 text-right font-mono text-sm font-bold text-[#70675b]">
                      {project.progress}%
                    </span>
                  </div>
                </td>
                <td className="border-t border-[#ded6ca] px-5 py-4 text-sm text-[#70675b]">
                  {formatDate(project.lastUpdated)}
                </td>
                <td className="border-t border-[#ded6ca] px-5 py-4">
                  <div
                    className={
                      positive
                        ? "flex items-center gap-2 text-sm font-bold text-[#426c3d]"
                        : "flex items-center gap-2 text-sm font-bold text-[#9f452c]"
                    }
                  >
                    <CircleDollarSign className="h-4 w-4" aria-hidden />
                    {formatCurrency(profit)}
                  </div>
                </td>
                <td className="border-t border-[#ded6ca] px-5 py-4 text-right">
                  <ButtonLink
                    href={`/projects/${project.id}`}
                    variant="secondary"
                    className="h-9 rounded-md px-3"
                    aria-label={`${project.name}の詳細を見る`}
                  >
                    詳細
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
