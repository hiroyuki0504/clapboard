import "server-only";

import { reviewSystem } from "@/lib/code-review-system";
import {
  getProjectById as getMockProjectById,
  projects as mockProjects,
} from "@/lib/mock-data";
import type { Project, ProjectFile, ProjectMinute } from "@/lib/types";

export type ApiDataSource = "backend" | "mock";

export type ApiResult<T> = {
  data: T;
  source: ApiDataSource;
  connected: boolean;
  fallbackReason?: string;
};

export type CodeReviewSystem = typeof reviewSystem;

type BackendFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: string };

type ProjectsPayload = Project[] | { projects?: Project[]; data?: Project[] };
type ProjectPayload = Project | { project?: Project | null; data?: Project | null } | null;
type CodeReviewPayload =
  | CodeReviewSystem
  | { reviewSystem?: CodeReviewSystem; data?: CodeReviewSystem };

const backendBaseUrl = process.env.CLAPBOARD_API_BASE_URL?.replace(/\/+$/, "");
const backendToken = process.env.CLAPBOARD_API_TOKEN;
const backendTimeoutMs = normalizeTimeout(process.env.CLAPBOARD_API_TIMEOUT_MS);

function normalizeTimeout(value: string | undefined) {
  const parsed = Number(value ?? 5000);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 5000;
  }

  return parsed;
}

function mockResult<T>(data: T, fallbackReason?: string): ApiResult<T> {
  return {
    data,
    source: "mock",
    connected: false,
    fallbackReason,
  };
}

function backendResult<T>(data: T): ApiResult<T> {
  return {
    data,
    source: "backend",
    connected: true,
  };
}

async function fetchBackendJson<T>(path: string): Promise<BackendFetchResult<T>> {
  if (!backendBaseUrl) {
    return {
      ok: false,
      reason: "CLAPBOARD_API_BASE_URL is not set",
    };
  }

  const headers = new Headers({ Accept: "application/json" });

  if (backendToken) {
    headers.set("Authorization", `Bearer ${backendToken}`);
  }

  try {
    const url = new URL(path.replace(/^\/+/, ""), `${backendBaseUrl}/`);
    const response = await fetch(url, {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(backendTimeoutMs),
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: `Backend API returned ${response.status} for ${path}`,
      };
    }

    return {
      ok: true,
      data: (await response.json()) as T,
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return {
        ok: false,
        reason: `Backend API request timed out after ${backendTimeoutMs}ms`,
      };
    }

    const message = error instanceof Error ? error.message : "Unknown API error";

    return {
      ok: false,
      reason: `Backend API request failed: ${message}`,
    };
  }
}

function isProjectShape(value: unknown): value is Project {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Project>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.minutes) &&
    Array.isArray(candidate.files)
  );
}

function isCodeReviewShape(value: unknown): value is CodeReviewSystem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<CodeReviewSystem>;
  return (
    Array.isArray(candidate.branches) &&
    Array.isArray(candidate.pullRequests) &&
    Array.isArray(candidate.priorityLevels) &&
    Array.isArray(candidate.policies) &&
    Array.isArray(candidate.pipeline)
  );
}

function unwrapProjects(payload: ProjectsPayload): Project[] {
  const candidate = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.projects)
      ? payload.projects
      : Array.isArray(payload.data)
        ? payload.data
        : null;

  if (!candidate || !candidate.every(isProjectShape)) {
    throw new Error("Backend projects payload is invalid");
  }

  return candidate;
}

function unwrapProject(payload: ProjectPayload): Project | null {
  if (!payload) {
    return null;
  }

  const candidate =
    "project" in payload || "data" in payload
      ? (payload.project ?? payload.data ?? null)
      : payload;

  if (candidate === null) {
    return null;
  }

  if (!isProjectShape(candidate)) {
    throw new Error("Backend project payload is invalid");
  }

  return candidate;
}

function unwrapCodeReviewSystem(payload: CodeReviewPayload): CodeReviewSystem {
  const candidate =
    "reviewSystem" in payload && payload.reviewSystem
      ? payload.reviewSystem
      : "data" in payload && payload.data
        ? payload.data
        : payload;

  if (!isCodeReviewShape(candidate)) {
    throw new Error("Backend code review payload is invalid");
  }

  return candidate;
}

export async function getProjects(): Promise<ApiResult<Project[]>> {
  const backend = await fetchBackendJson<ProjectsPayload>("/projects");

  if (!backend.ok) {
    return mockResult(mockProjects, backend.reason);
  }

  try {
    return backendResult(unwrapProjects(backend.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid projects payload";
    return mockResult(mockProjects, message);
  }
}

export async function getProject(id: string): Promise<ApiResult<Project | null>> {
  const fallbackProject = getMockProjectById(id) ?? null;
  const backend = await fetchBackendJson<ProjectPayload>(
    `/projects/${encodeURIComponent(id)}`,
  );

  if (!backend.ok) {
    return mockResult(fallbackProject, backend.reason);
  }

  try {
    return backendResult(unwrapProject(backend.data));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid project payload";
    return mockResult(fallbackProject, message);
  }
}

export async function getCodeReviewSystem(): Promise<ApiResult<CodeReviewSystem>> {
  const backend = await fetchBackendJson<CodeReviewPayload>("/code-review");

  if (!backend.ok) {
    return mockResult(reviewSystem, backend.reason);
  }

  try {
    return backendResult(unwrapCodeReviewSystem(backend.data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid code review payload";
    return mockResult(reviewSystem, message);
  }
}

export function getProjectFiles(
  projects: Project[],
): Array<ProjectFile & { projectId: string; projectName: string }> {
  return projects
    .flatMap((project) =>
      project.files.map((file) => ({
        ...file,
        projectId: project.id,
        projectName: project.name,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export function getProjectMinutes(
  projects: Project[],
): Array<ProjectMinute & { projectId: string; projectName: string }> {
  return projects
    .flatMap((project) =>
      project.minutes.map((minute) => ({
        ...minute,
        projectId: project.id,
        projectName: project.name,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getApiHealth() {
  const backend = await fetchBackendJson<unknown>("/health");
  const externalConfigured = Boolean(backendBaseUrl);
  const externalHealthy = !externalConfigured || backend.ok;
  const isProduction = process.env.NODE_ENV === "production";
  const exposedBaseUrl = isProduction ? null : (backendBaseUrl ?? null);
  const exposedFallbackReason = backend.ok
    ? null
    : isProduction
      ? "external backend unavailable"
      : backend.reason;

  return {
    ok: externalHealthy,
    service: "clapboard",
    localApi: "connected",
    dataSource: backend.ok ? "backend" : "mock",
    externalApi: {
      configured: externalConfigured,
      connected: backend.ok,
      baseUrl: exposedBaseUrl,
      timeoutMs: backendTimeoutMs,
      fallbackReason: exposedFallbackReason,
    },
    endpoints: [
      "/api/health",
      "/api/projects",
      "/api/projects/[id]",
      "/api/code-review",
    ],
  };
}
