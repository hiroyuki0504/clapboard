import { AlertTriangle, ArrowUpRight, CalendarDays } from "lucide-react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  getHighPriorityOpenTaskCount,
  getOpenTaskCount,
} from "@/lib/project-selectors";
import type { Project } from "@/lib/types";
import { cn, formatDate, normalizeProgressValue } from "@/lib/utils";

type ProjectTableProps = {
  projects: Project[];
  density?: "comfortable" | "compact";
  showRisk?: boolean;
};

export function ProjectTable({
  projects,
  density = "comfortable",
  showRisk = true,
}: ProjectTableProps) {
  const rowPadding = density === "compact" ? "py-3" : "py-4";

  return (
    <>
      <div className="grid gap-3 p-3 md:hidden">
        {projects.map((project) => {
          const blockers = getHighPriorityOpenTaskCount(project.tasks);
          const openTasks = getOpenTaskCount(project.tasks);
          const progressValue = normalizeProgressValue(project.progress);

          return (
            <article
              key={project.id}
              className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-[#312d27]">
                    {project.name}
                  </p>
                  <p className="mt-1 text-sm text-[#70675b]">{project.owner}</p>
                </div>
                <ProjectStatusBadge status={project.status} />
              </div>

              {density === "comfortable" && (
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-[#70675b]">
                  {project.summary}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <Progress value={progressValue} />
                <span className="w-10 text-right font-mono text-sm font-bold text-[#70675b]">
                  {progressValue}%
                </span>
              </div>

              <div className="mt-4 grid gap-2 text-sm text-[#70675b]">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-[#8b8175]" aria-hidden />
                  <span>次の節目 {formatDate(project.dueDate)}</span>
                </div>
                {showRisk && (
                  <div className="flex items-center gap-2 font-bold text-[#312d27]">
                    <AlertTriangle
                      className={
                        blockers > 0
                          ? "h-4 w-4 shrink-0 text-[#cf623d]"
                          : "h-4 w-4 shrink-0 text-[#8bb17f]"
                      }
                      aria-hidden
                    />
                    {blockers > 0 ? `${blockers}件停滞` : `未完了${openTasks}件`}
                  </div>
                )}
              </div>

              <ButtonLink
                href={`/projects/${project.id}`}
                variant="secondary"
                className="mt-4 h-9 w-full rounded-md px-3"
                aria-label={`${project.name}を開く`}
              >
                開く
                <ArrowUpRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
      <table
        className={cn(
          "w-full border-separate border-spacing-0",
          showRisk ? "min-w-[900px]" : "min-w-[780px]",
        )}
      >
        <thead>
          <tr className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
            <th scope="col" className="px-5 py-4">
              ワークストリーム
            </th>
            <th scope="col" className="px-5 py-4">
              オーナー
            </th>
            <th scope="col" className="px-5 py-4">
              状態
            </th>
            <th scope="col" className="px-5 py-4">
              進捗率
            </th>
            <th scope="col" className="px-5 py-4">
              次の節目
            </th>
            {showRisk && (
              <th scope="col" className="px-5 py-4">
                リスク
              </th>
            )}
            <th scope="col" className="px-5 py-4 text-right">
              開く
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const blockers = getHighPriorityOpenTaskCount(project.tasks);
            const openTasks = getOpenTaskCount(project.tasks);
            const progressValue = normalizeProgressValue(project.progress);

            return (
              <tr
                key={project.id}
                className="group transition hover:bg-[#fbfaf5]"
              >
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
                  {project.owner}
                </td>
                <td className={cn("border-t border-[#ded6ca] px-5", rowPadding)}>
                  <ProjectStatusBadge status={project.status} shape="vertical" />
                </td>
                <td className={cn("border-t border-[#ded6ca] px-5", rowPadding)}>
                  <div className="flex min-w-36 items-center gap-3">
                    <Progress value={progressValue} />
                    <span className="w-10 text-right font-mono text-sm font-bold text-[#70675b]">
                      {progressValue}%
                    </span>
                  </div>
                </td>
                <td className={cn("border-t border-[#ded6ca] px-5 text-sm text-[#70675b]", rowPadding)}>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#8b8175]" aria-hidden />
                    {formatDate(project.dueDate)}
                  </div>
                </td>
                {showRisk && (
                  <td className={cn("border-t border-[#ded6ca] px-5", rowPadding)}>
                    <div className="flex items-center gap-2 text-sm font-bold text-[#312d27]">
                      <AlertTriangle
                        className={
                          blockers > 0
                            ? "h-4 w-4 text-[#cf623d]"
                            : "h-4 w-4 text-[#8bb17f]"
                        }
                        aria-hidden
                      />
                      {blockers > 0 ? `${blockers}件停滞` : `未完了${openTasks}件`}
                    </div>
                  </td>
                )}
                <td className={cn("border-t border-[#ded6ca] px-5 text-right", rowPadding)}>
                  <ButtonLink
                    href={`/projects/${project.id}`}
                    variant="secondary"
                    className="h-9 rounded-md px-3"
                    aria-label={`${project.name}を開く`}
                  >
                    開く
                    <ArrowUpRight className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
}
