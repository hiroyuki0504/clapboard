import { getProjects } from "@/lib/clapboard-api";
import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";

export async function SidebarAgentSummary() {
  const { data: projects, error } = await getProjects();
  if (error) {
    return <p className="mt-1 text-[#9a4a31]">backend error</p>;
  }

  const allTasks = projects.flatMap((project) => project.tasks);
  const taskCount = allTasks.length;
  const blockerCount = getHighPriorityOpenTaskCount(allTasks);

  return (
    <p className="mt-1">
      {taskCount} tasks ・ {blockerCount} blockers
    </p>
  );
}

export function SidebarAgentSummaryFallback() {
  return <p className="mt-1 text-[#9a9084]">— tasks ・ — blockers</p>;
}
