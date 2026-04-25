import { getProjects } from "@/lib/clapboard-api";

export async function WorkspaceStreamPill() {
  const { data: projects } = await getProjects();
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
  const { data: projects } = await getProjects();
  const allTasks = projects.flatMap((project) => project.tasks);
  const taskCount = allTasks.length;
  const blockerCount = allTasks.filter(
    (task) => !task.completed && task.priority === "high",
  ).length;

  return (
    <p className="mt-1">
      {taskCount} tasks ・ {blockerCount} blockers
    </p>
  );
}

export function SidebarAgentSummaryFallback() {
  return <p className="mt-1 text-[#9a9084]">— tasks ・ — blockers</p>;
}
