import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";
import type { Project } from "@/lib/types";

export type GraphTone = "project" | "task" | "file" | "minute" | "support";

export type GraphNode = {
  id: string;
  label: string;
  sub: string;
  tone: GraphTone;
  x: number;
  y: number;
  href?: string;
};

export type GraphEdge = {
  from: string;
  to: string;
};

export type GraphModel = {
  focus: Project | undefined;
  nodes: GraphNode[];
  edges: GraphEdge[];
  nodeById: Map<string, GraphNode>;
};

export function buildGraphModel(projects: Project[]): GraphModel {
  const focus = [...projects].sort(
    (a, b) =>
      getHighPriorityOpenTaskCount(b.tasks) -
        getHighPriorityOpenTaskCount(a.tasks) ||
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  )[0];

  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  if (focus) {
    nodes.push({
      id: focus.id,
      label: focus.name,
      sub: `${focus.progress}% / ${focus.client}`,
      tone: "project",
      x: 170,
      y: 150,
      href: `/projects/${focus.id}`,
    });

    const blocker = focus.tasks.find(
      (task) => !task.completed && task.priority === "high",
    );
    if (blocker) {
      nodes.push({
        id: blocker.id,
        label: blocker.title,
        sub: "高優先度タスク",
        tone: "task",
        x: 455,
        y: 280,
        href: `/projects/${focus.id}?tab=progress`,
      });
      edges.push({ from: focus.id, to: blocker.id });
    }

    const minute = focus.minutes[0];
    if (minute) {
      nodes.push({
        id: minute.id,
        label: minute.title,
        sub: "議事録",
        tone: "minute",
        x: 590,
        y: 120,
        href: `/projects/${focus.id}?tab=minutes`,
      });
      edges.push({ from: focus.id, to: minute.id });
    }

    const file = focus.files[0];
    if (file) {
      nodes.push({
        id: file.id,
        label: file.name,
        sub: file.type.toUpperCase(),
        tone: "file",
        x: 785,
        y: 250,
        href: `/projects/${focus.id}?tab=files`,
      });
      edges.push({ from: minute?.id ?? focus.id, to: file.id });
      if (blocker) edges.push({ from: blocker.id, to: file.id });
    }
  }

  projects
    .filter((project) => project.id !== focus?.id)
    .slice(0, 2)
    .forEach((project, index) => {
      nodes.push({
        id: project.id,
        label: project.name,
        sub: `${project.progress}% / ${project.client}`,
        tone: "support",
        x: index === 0 ? 300 : 720,
        y: index === 0 ? 410 : 390,
        href: `/projects/${project.id}`,
      });
      if (focus) {
        edges.push({ from: focus.id, to: project.id });
      }
    });

  return {
    focus,
    nodes,
    edges,
    nodeById: new Map(nodes.map((node) => [node.id, node])),
  };
}
