import { CommandHeader } from "@/components/dashboard/command-header";
import { DependencyGraphCard } from "@/components/dashboard/dependency-graph-card";
import { FilesSection } from "@/components/dashboard/files-section";
import { GuideSection } from "@/components/dashboard/guide-section";
import { MinutesSection } from "@/components/dashboard/minutes-section";
import { ProgressAgentLog } from "@/components/dashboard/progress-agent-log";
import { RecentProjectsSection } from "@/components/dashboard/recent-projects-section";
import { StatPills } from "@/components/dashboard/stat-pills";
import { TodoSection } from "@/components/dashboard/todo-section";
import { WeeklyProgressCard } from "@/components/dashboard/weekly-progress-card";
import { WelcomeCard } from "@/components/dashboard/welcome-card";
import {
  getProjectFiles,
  getProjectMinutes,
  getProjects,
} from "@/lib/clapboard-api";
import {
  getActiveProjects,
  getAverageProgress,
  getCompletedTasks,
  getHighPriorityOpenTasks,
  getLatestTaskProjectDate,
  getNextMilestoneDate,
  getOpenTasks,
} from "@/lib/project-selectors";
import { buildDateLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const projectList = projectsResult.data;
  const allFiles = getProjectFiles(projectList);
  const allMinutes = getProjectMinutes(projectList);
  const activeWorkstreams = getActiveProjects(projectList);
  const allTasks = projectList.flatMap((project) =>
    project.tasks.map((task) => ({
      ...task,
      projectId: project.id,
      projectName: project.name,
    })),
  );
  const incompleteTasks = getOpenTasks(allTasks);
  const blockerTasks = getHighPriorityOpenTasks(allTasks);
  const completedTasks = getCompletedTasks(allTasks);
  const averageProgress = getAverageProgress(projectList);
  const recentWorkstreams = [...projectList].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
  const milestoneCount = activeWorkstreams.filter((project) =>
    Boolean(project.dueDate),
  ).length;
  const dateLabel = buildDateLabel(new Date());

  return (
    <div className="space-y-4">
      <WelcomeCard />

      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <CommandHeader
          dateLabel={dateLabel}
          blockerCount={blockerTasks.length}
          connected={projectsResult.connected}
        />
        <StatPills
          activeCount={activeWorkstreams.length}
          averageProgress={averageProgress}
          completedCount={completedTasks.length}
          blockerCount={blockerTasks.length}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr_0.95fr]">
        <TodoSection tasks={incompleteTasks} />
        <MinutesSection minutes={allMinutes} />
        <GuideSection />
        <RecentProjectsSection projects={recentWorkstreams} />
        <ProgressAgentLog
          latestProjectAt={recentWorkstreams[0]?.lastUpdated}
          latestBlockerAt={getLatestTaskProjectDate(projectList, "high")}
          nextMilestoneAt={getNextMilestoneDate(activeWorkstreams)}
          latestMinuteAt={allMinutes[0]?.createdAt}
          streamCount={activeWorkstreams.length}
          blockerCount={blockerTasks.length}
          completedCount={completedTasks.length}
          milestoneCount={milestoneCount}
          minuteCount={allMinutes.length}
        />
        <DependencyGraphCard projects={projectList} />
        <WeeklyProgressCard
          averageProgress={averageProgress}
          completedCount={completedTasks.length}
          blockerCount={blockerTasks.length}
          milestoneCount={milestoneCount}
        />
        <FilesSection files={allFiles} />
      </section>
    </div>
  );
}
