import { getProjects } from "@/lib/clapboard-api";
import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";

export async function WorkspaceStreamPill() {
  const { data: projects, error } = await getProjects();
  if (error) {
    return (
      <span className="rounded-full border border-[#d2a528] bg-[#fff3c8] px-3 py-1 text-[#6f5415]">
        backend error
      </span>
    );
  }

  return (
    <span className="rounded-full border border-[#c8c0b3] bg-[#fffefa] px-3 py-1">
      {projects.length} streams
    </span>
  );
}

export function WorkspaceStreamPillFallback() {
  return (
    <span className="rounded-full border border-[#c8c0b3] bg-[#fffefa] px-3 py-1 text-[#9a9084]">
      … streams
    </span>
  );
}

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
