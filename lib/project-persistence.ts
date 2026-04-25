import type { Project, ProjectSnapshot, ProjectSnapshotData } from "@/lib/types";

const STORAGE_KEY_PREFIX = "clapboard:project:";
const PROJECT_SNAPSHOT_VERSION: ProjectSnapshot["version"] = 1;

function getStorageKey(projectId: string) {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function isProjectSnapshotData(value: unknown): value is ProjectSnapshotData {
  if (typeof value !== "object" || value == null) {
    return false;
  }

  const candidate = value as Partial<ProjectSnapshotData>;

  return (
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.decisions) &&
    Array.isArray(candidate.ambiguities) &&
    Array.isArray(candidate.minutes) &&
    Array.isArray(candidate.imports) &&
    typeof candidate.lastUpdated === "string"
  );
}

function normalizeProjectSnapshot(value: unknown): ProjectSnapshot | null {
  if (!isProjectSnapshotData(value)) {
    return null;
  }

  const version = (value as Partial<ProjectSnapshot>).version;

  if (version != null && version !== PROJECT_SNAPSHOT_VERSION) {
    return null;
  }

  return {
    ...value,
    version: PROJECT_SNAPSHOT_VERSION,
  };
}

export function createProjectSnapshotData(project: Project): ProjectSnapshotData {
  return {
    lastUpdated: project.lastUpdated,
    tasks: project.tasks,
    decisions: project.decisions,
    ambiguities: project.ambiguities,
    minutes: project.minutes,
    imports: project.imports,
  };
}

export function mergeProjectWithSnapshot<T extends Project>(
  project: T,
  snapshot: ProjectSnapshot | null,
): T {
  if (!snapshot) {
    return project;
  }

  const { version: _version, ...snapshotData } = snapshot;

  return {
    ...project,
    ...snapshotData,
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

    return normalizeProjectSnapshot(parsed);
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
  snapshot: ProjectSnapshotData,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const versionedSnapshot: ProjectSnapshot = {
      ...snapshot,
      version: PROJECT_SNAPSHOT_VERSION,
    };

    window.localStorage.setItem(
      getStorageKey(projectId),
      JSON.stringify(versionedSnapshot),
    );
  } catch (error) {
    console.warn("failed to persist project snapshot", {
      projectId,
      error,
    });
  }
}
