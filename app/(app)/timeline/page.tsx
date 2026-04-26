import {
  type SerializableTimelineEvent,
  TimelineWorkspace,
} from "@/components/timeline/timeline-workspace";
import { getProjects } from "@/lib/clapboard-api";
import {
  getAllProjectTasks,
  getHighPriorityOpenTasks,
  getOpenTasks,
  getProjectRevenueTotal,
} from "@/lib/project-selectors";
import { buildTimelineEvents } from "@/lib/timeline-events";
import { startOfDay } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const projects = projectsResult.data;
  const today = startOfDay(new Date());
  const allTasks = getAllProjectTasks(projects);
  const openTasks = getOpenTasks(allTasks);
  const blockers = getHighPriorityOpenTasks(allTasks);
  const events = buildTimelineEvents(projects);
  const weekRevenue = getProjectRevenueTotal(projects);

  const initialEvents: SerializableTimelineEvent[] = events.map((event) => ({
    id: event.id,
    lane: event.lane,
    dateIso: event.date.toISOString(),
    title: event.title,
    sub: event.sub,
    tone: event.tone,
    href: event.href,
  }));

  return (
    <TimelineWorkspace
      initialEvents={initialEvents}
      todayIso={today.toISOString()}
      openTasksCount={openTasks.length}
      blockersCount={blockers.length}
      weekRevenue={weekRevenue}
    />
  );
}
