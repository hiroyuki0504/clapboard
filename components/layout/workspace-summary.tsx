import { getProjects } from "@/lib/clapboard-api";

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

export async function WorkspaceAgentPill() {
  const { data: projects, error } = await getProjects();

  if (error) {
    return (
      <span className="rounded-full border border-[#d2a528] bg-[#fff3c8] px-3 py-1 text-[#6f5415]">
        Agent: backend error
      </span>
    );
  }

  const blockers = projects.reduce(
    (total, project) =>
      total +
      project.tasks.filter(
        (task) => !task.completed && task.priority === "high",
      ).length,
    0,
  );
  const activeStreams = projects.filter(
    (project) => project.status !== "completed",
  ).length;

  return (
    <span className="rounded-full border border-[#a8bed4] bg-[#eef4f8] px-3 py-1 text-[#315a78]">
      Agent: {blockers > 0 ? `確認 ${blockers}件` : `監視 ${activeStreams}件`}
    </span>
  );
}

export function WorkspaceAgentPillFallback() {
  return (
    <span className="rounded-full border border-[#a8bed4] bg-[#eef4f8] px-3 py-1 text-[#7891a4]">
      Agent: …
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
