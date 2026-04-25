import type { Project } from "@/lib/types";

type ProjectSnapshot = Pick<
  Project,
  "tasks" | "decisions" | "ambiguities" | "minutes" | "imports"
> & {
  lastUpdated: string;
};

const STORAGE_KEY_PREFIX = "clapboard:project:";

function getStorageKey(projectId: string) {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function isProjectSnapshot(value: unknown): value is ProjectSnapshot {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const candidate = value as Partial<ProjectSnapshot>;

  return (
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.decisions) &&
    Array.isArray(candidate.ambiguities) &&
    Array.isArray(candidate.minutes) &&
    Array.isArray(candidate.imports) &&
    typeof candidate.lastUpdated === "string"
  );
}

export function mergeProjectWithSnapshot<T extends Project>(
  project: T,
  snapshot: ProjectSnapshot | null,
): T {
  if (!snapshot) {
    return project;
  }

  return {
    ...project,
    ...snapshot,
  };
}

export function readProjectSnapshot(projectId: string): ProjectSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getStorageKey(projectId));

    if (!rawValue) {
      return null;
    }

    const parsed = JSON.parse(rawValue) as unknown;

    return isProjectSnapshot(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readProjectsWithSnapshots<T extends Project>(projects: T[]): T[] {
  return projects.map((project) =>
    mergeProjectWithSnapshot(project, readProjectSnapshot(project.id)),
  );
}

export function writeProjectSnapshot(
  projectId: string,
  snapshot: ProjectSnapshot,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(getStorageKey(projectId), JSON.stringify(snapshot));
}
