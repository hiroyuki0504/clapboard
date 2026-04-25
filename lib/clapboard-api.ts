import "server-only";

import { cache } from "react";
import {
  type CodeReviewSystem,
  isCodeReviewShape,
  isProjectShape,
} from "@/lib/clapboard-api-validators";
import { reviewSystem } from "@/lib/code-review-system";
import {
  getProjectById as getMockProjectById,
  projects as mockProjects,
} from "@/lib/mock-data";
import type { Project } from "@/lib/types";

export type { CodeReviewSystem } from "@/lib/clapboard-api-validators";
export {
  getAllProjectFiles as getProjectFiles,
  getAllProjectMinutes as getProjectMinutes,
} from "@/lib/project-selectors";

export type ApiDataSource = "backend" | "mock";

export type ApiResult<T> = {
  data: T;
  source: ApiDataSource;
  connected: boolean;
  fallbackReason?: string;
  error?: ApiError;
};

export type ApiError = {
  status: number;
  message: string;
};

type BackendFetchFailure = {
  ok: false;
  reason: string;
  status?: number;
  fallbackAllowed: boolean;
};

type BackendFetchResult<T> = { ok: true; data: T } | BackendFetchFailure;

type ProjectsPayload = Project[] | { projects?: Project[]; data?: Project[] };
type ProjectPayload = Project | { project?: Project | null; data?: Project | null } | null;
type CodeReviewPayload =
  | CodeReviewSystem
  | { reviewSystem?: CodeReviewSystem; data?: CodeReviewSystem };

const backendBaseUrl = process.env.CLAPBOARD_API_BASE_URL?.replace(/\/+$/, "");
const backendToken = process.env.CLAPBOARD_API_TOKEN;
const backendTimeoutMs = normalizeTimeout(process.env.CLAPBOARD_API_TIMEOUT_MS);
const NON_FALLBACK_BACKEND_STATUSES = new Set([401, 403, 404]);

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

function backendErrorResult<T>(data: T, backend: BackendFetchFailure): ApiResult<T> {
  return {
    data,
    source: "backend",
    connected: false,
    fallbackReason: backend.reason,
    error: {
      status: backend.status ?? 502,
      message: backend.reason,
    },
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
      fallbackAllowed: true,
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
        status: response.status,
        fallbackAllowed: !NON_FALLBACK_BACKEND_STATUSES.has(response.status),
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
        fallbackAllowed: true,
      };
    }

    const message = error instanceof Error ? error.message : "Unknown API error";

    return {
      ok: false,
      reason: `Backend API request failed: ${message}`,
      fallbackAllowed: true,
    };
  }
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

export const getProjects = cache(
  async (): Promise<ApiResult<Project[]>> => {
    const backend = await fetchBackendJson<ProjectsPayload>("/projects");

    if (!backend.ok) {
      if (!backend.fallbackAllowed) {
        return backendErrorResult([], backend);
      }
      return mockResult(mockProjects, backend.reason);
    }

    try {
      return backendResult(unwrapProjects(backend.data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid projects payload";
      return mockResult(mockProjects, message);
    }
  },
);

export const getProject = cache(
  async (id: string): Promise<ApiResult<Project | null>> => {
    const fallbackProject = getMockProjectById(id) ?? null;
    const backend = await fetchBackendJson<ProjectPayload>(
      `/projects/${encodeURIComponent(id)}`,
    );

    if (!backend.ok) {
      if (!backend.fallbackAllowed) {
        return backendErrorResult(null, backend);
      }
      return mockResult(fallbackProject, backend.reason);
    }

    try {
      return backendResult(unwrapProject(backend.data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid project payload";
      return mockResult(fallbackProject, message);
    }
  },
);

export const getCodeReviewSystem = cache(
  async (): Promise<ApiResult<CodeReviewSystem>> => {
    const backend = await fetchBackendJson<CodeReviewPayload>("/code-review");

    if (!backend.ok) {
      if (!backend.fallbackAllowed) {
        return backendErrorResult(reviewSystem, backend);
      }
      return mockResult(reviewSystem, backend.reason);
    }

    try {
      return backendResult(unwrapCodeReviewSystem(backend.data));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid code review payload";
      return mockResult(reviewSystem, message);
    }
  },
);

export function publicFallbackReason(reason: string | undefined) {
  if (!reason) return null;
  return process.env.NODE_ENV === "production"
    ? "external backend unavailable"
    : reason;
}

export function publicApiError(error: ApiError | undefined) {
  if (!error) return null;

  const message =
    process.env.NODE_ENV === "production"
      ? error.status === 404
        ? "external backend resource not found"
        : "external backend unavailable"
      : error.message;

  return {
    error: "backend-error",
    status: error.status,
    message,
  };
}

export async function getApiHealth() {
  const backend = await fetchBackendJson<unknown>("/health");
  const externalConfigured = Boolean(backendBaseUrl);
  const externalHealthy = !externalConfigured || backend.ok;
  const isProduction = process.env.NODE_ENV === "production";
  const exposedBaseUrl = isProduction ? null : (backendBaseUrl ?? null);
  const exposedFallbackReason = backend.ok
    ? null
    : publicFallbackReason(backend.reason);

  return {
    ok: externalHealthy,
    service: "clapboard",
    localApi: "connected",
    dataSource: backend.ok ? "backend" : backend.fallbackAllowed ? "mock" : "backend-error",
    externalApi: {
      configured: externalConfigured,
      connected: backend.ok,
      status: backend.ok ? 200 : (backend.status ?? null),
      fallbackAllowed: backend.ok ? false : backend.fallbackAllowed,
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
