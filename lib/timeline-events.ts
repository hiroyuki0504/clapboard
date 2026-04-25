import type { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export type LaneKey = "agent" | "todo" | "files" | "finance";

export type TimelineEventTone = "red" | "amber" | "blue" | "green" | "slate";

export type TimelineEvent = {
  id: string;
  lane: LaneKey;
  date: Date;
  title: string;
  sub: string;
  tone: TimelineEventTone;
  href?: string;
};

export function buildTimelineEvents(projects: Project[]): TimelineEvent[] {
  return projects.flatMap((project) => {
    const events: TimelineEvent[] = [
      {
        id: `${project.id}-agent`,
        lane: "agent",
        date: new Date(project.lastUpdated),
        title: `${project.name.slice(0, 12)}更新`,
        sub: `${project.progress}%`,
        tone: project.status === "at-risk" ? "red" : "slate",
        href: `/projects/${project.id}`,
      },
      ...project.tasks
        .filter((task) => !task.completed)
        .slice(0, 2)
        .map<TimelineEvent>((task) => ({
          id: `${project.id}-${task.id}`,
          lane: "todo",
          date: new Date(project.lastUpdated),
          title: task.title,
          sub: `${project.name} / 締切 ${project.dueDate}`,
          tone: task.priority === "high" ? "red" : "amber",
          href: `/projects/${project.id}?tab=progress`,
        })),
      ...project.files.slice(0, 1).map<TimelineEvent>((file) => ({
        id: `${project.id}-${file.id}`,
        lane: "files",
        date: new Date(file.updatedAt),
        title: file.name,
        sub: file.type.toUpperCase(),
        tone: "blue",
        href: `/projects/${project.id}?tab=files`,
      })),
      ...project.transactions.slice(-1).map<TimelineEvent>((transaction) => ({
        id: `${project.id}-${transaction.id}`,
        lane: "finance",
        date: new Date(transaction.date),
        title: transaction.label,
        sub: formatCurrency(transaction.amount),
        tone: transaction.type === "revenue" ? "green" : "amber",
        href: `/projects/${project.id}?tab=finance`,
      })),
    ];

    return events.filter((event) => !Number.isNaN(event.date.getTime()));
  });
}
