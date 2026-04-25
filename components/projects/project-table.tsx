import { ArrowUpRight, CircleDollarSign } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import type { Project } from "@/lib/types";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

type ProjectTableProps = {
  projects: Project[];
  density?: "comfortable" | "compact";
  showFinancials?: boolean;
};

export function ProjectTable({
  projects,
  density = "comfortable",
  showFinancials = true,
}: ProjectTableProps) {
  if (projects.length === 0) {
    return (
      <div className="px-5 py-10 text-sm text-[#81786d]">
        条件に合う案件はありません。検索語やステータスを見直してください。
      </div>
    );
  }

  const rowPadding = density === "compact" ? "py-3" : "py-4";

  return (
    <div className="overflow-x-auto">
      <table
        className={cn(
          "w-full border-separate border-spacing-0",
          showFinancials ? "min-w-[900px]" : "min-w-[780px]",
        )}
      >
        <thead>
          <tr className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
            <th className="px-5 py-4">案件名</th>
            <th className="px-5 py-4">クライアント</th>
            <th className="px-5 py-4">ステータス</th>
            <th className="px-5 py-4">進捗</th>
            <th className="px-5 py-4">最終更新</th>
            {showFinancials && <th className="px-5 py-4">収支</th>}
            <th className="px-5 py-4 text-right">詳細</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const profit = project.revenue - project.cost;

            return (
              <tr key={project.id} className="group">
                <td className={cn("border-t border-[#ded6ca] px-5", rowPadding)}>
                  <div>
                    <p className="font-bold text-[#312d27]">{project.name}</p>
                    {density === "comfortable" && (
                      <p className="mt-1 line-clamp-1 text-sm text-[#70675b]">
                        {project.summary}
                      </p>
                    )}
                  </div>
                </td>
                <td className={cn("border-t border-[#ded6ca] px-5 text-sm text-[#70675b]", rowPadding)}>
                  {project.client}
                </td>
                <td className={cn("border-t border-[#ded6ca] px-5", rowPadding)}>
                  <ProjectStatusBadge status={project.status} />
                </td>
                <td className={cn("border-t border-[#ded6ca] px-5", rowPadding)}>
                  <div className="flex min-w-36 items-center gap-3">
                    <Progress value={project.progress} />
                    <span className="w-10 text-right font-mono text-sm font-bold text-[#70675b]">
                      {project.progress}%
                    </span>
                  </div>
                </td>
                <td className={cn("border-t border-[#ded6ca] px-5 text-sm text-[#70675b]", rowPadding)}>
                  {formatDate(project.lastUpdated)}
                </td>
                {showFinancials && (
                  <td className={cn("border-t border-[#ded6ca] px-5", rowPadding)}>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#312d27]">
                      <CircleDollarSign className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
                      {formatCurrency(profit)}
                    </div>
                  </td>
                )}
                <td className={cn("border-t border-[#ded6ca] px-5 text-right", rowPadding)}>
                  <ButtonLink
                    href={`/projects/${project.id}`}
                    variant="secondary"
                    className="h-9 rounded-md px-3"
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
