import { AlertTriangle, ArrowUpRight, CalendarDays } from "lucide-react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ButtonLink } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-0">
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
            <th scope="col" className="px-5 py-4">
              リスク
            </th>
            <th scope="col" className="px-5 py-4 text-right">
              開く
            </th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => {
            const blockers = project.tasks.filter(
              (task) => !task.completed && task.priority === "high",
            ).length;
            const openTasks = project.tasks.filter((task) => !task.completed).length;

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
                  {project.owner}
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
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-[#8b8175]" aria-hidden />
                    {formatDate(project.dueDate)}
                  </div>
                </td>
                <td className="border-t border-[#ded6ca] px-5 py-4">
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
                <td className="border-t border-[#ded6ca] px-5 py-4 text-right">
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
  );
}
