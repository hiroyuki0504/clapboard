import "server-only";

import { cache } from "react";
import {
  reviewSystem,
  type AgentWorktree,
  type BranchWorkstream,
  type CodexReviewComment,
  type NoCodeDevRequest,
  type PullRequestReview,
  type ReviewPriorityLevel,
} from "@/lib/code-review-system";
import {
  getProjectById as getMockProjectById,
  projects as mockProjects,
} from "@/lib/mock-data";
import type {
  FinanceTransaction,
  Project,
  ProjectFile,
  ProjectMinute,
  ProjectTask,
  ProjectUpdate,
} from "@/lib/types";

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

export type CodeReviewSystem = typeof reviewSystem;

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
const MIN_PROGRESS = 0;
const MAX_PROGRESS = 100;

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

const TASK_PRIORITIES = new Set(["high", "medium", "low"]);
const FILE_TYPES = new Set(["docs", "sheet", "slide", "folder", "pdf"]);
const PROJECT_STATUSES = new Set([
  "planning",
  "in-progress",
  "review",
  "at-risk",
  "completed",
]);
const TRANSACTION_TYPES = new Set(["revenue", "expense"]);
const REVIEW_PRIORITIES = new Set(["crucial", "high", "medium", "low"]);
const REVIEW_COMMENT_STATUSES = new Set(["open", "fixed", "accepted-risk"]);
const REVIEW_STATES = new Set(["queued", "running", "needs-fix", "passed"]);
const MERGE_GATES = new Set(["open", "blocked", "ready"]);
const AGENT_WORKTREE_STATUSES = new Set([
  "queued",
  "building",
  "preview-ready",
  "pr-ready",
]);
const AGENT_WORKTREE_MODES = new Set([
  "prompt-to-branch",
  "issue-to-pr",
  "design-to-ui",
]);
const NO_CODE_REQUEST_STATUSES = new Set([
  "intake",
  "scoped",
  "building",
  "ready",
]);
const BRANCH_STATUSES = new Set([
  "design",
  "implementing",
  "review-ready",
  "changes-requested",
  "approved",
]);
const RISK_LEVELS = new Set(["low", "medium", "high"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isTaskShape(value: unknown): value is ProjectTask {
  if (!isObject(value)) return false;
  const c = value as Partial<ProjectTask>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.completed === "boolean" &&
    typeof c.priority === "string" &&
    TASK_PRIORITIES.has(c.priority) &&
    typeof c.note === "string"
  );
}

function isMinuteShape(value: unknown): value is ProjectMinute {
  if (!isObject(value)) return false;
  const c = value as Partial<ProjectMinute>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.createdAt === "string" &&
    Array.isArray(c.participants) &&
    c.participants.every((participant) => typeof participant === "string") &&
    typeof c.body === "string"
  );
}

function isFileShape(value: unknown): value is ProjectFile {
  if (!isObject(value)) return false;
  const c = value as Partial<ProjectFile>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.type === "string" &&
    FILE_TYPES.has(c.type) &&
    typeof c.updatedAt === "string" &&
    typeof c.url === "string"
  );
}

function isUpdateShape(value: unknown): value is ProjectUpdate {
  if (!isObject(value)) return false;
  const c = value as Partial<ProjectUpdate>;
  return (
    typeof c.id === "string" &&
    typeof c.date === "string" &&
    typeof c.text === "string"
  );
}

function isTransactionShape(value: unknown): value is FinanceTransaction {
  if (!isObject(value)) return false;
  const c = value as Partial<FinanceTransaction>;
  return (
    typeof c.id === "string" &&
    typeof c.date === "string" &&
    typeof c.label === "string" &&
    typeof c.type === "string" &&
    TRANSACTION_TYPES.has(c.type) &&
    typeof c.amount === "number" &&
    Number.isFinite(c.amount)
  );
}

function isProjectShape(value: unknown): value is Project {
  if (!isObject(value)) return false;
  const c = value as Partial<Project>;
  const progress = c.progress;
  const revenue = c.revenue;
  const cost = c.cost;

  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.client === "string" &&
    typeof c.status === "string" &&
    PROJECT_STATUSES.has(c.status) &&
    typeof progress === "number" &&
    Number.isFinite(progress) &&
    progress >= MIN_PROGRESS &&
    progress <= MAX_PROGRESS &&
    typeof c.lastUpdated === "string" &&
    typeof revenue === "number" &&
    Number.isFinite(revenue) &&
    typeof cost === "number" &&
    Number.isFinite(cost) &&
    typeof c.dueDate === "string" &&
    typeof c.owner === "string" &&
    typeof c.summary === "string" &&
    Array.isArray(c.updates) && c.updates.every(isUpdateShape) &&
    Array.isArray(c.tasks) && c.tasks.every(isTaskShape) &&
    Array.isArray(c.minutes) && c.minutes.every(isMinuteShape) &&
    Array.isArray(c.transactions) && c.transactions.every(isTransactionShape) &&
    Array.isArray(c.files) && c.files.every(isFileShape)
  );
}

function isReviewCommentShape(value: unknown): value is CodexReviewComment {
  if (!isObject(value)) return false;
  const c = value as Partial<CodexReviewComment>;
  return (
    typeof c.id === "string" &&
    typeof c.priority === "string" &&
    REVIEW_PRIORITIES.has(c.priority) &&
    typeof c.status === "string" &&
    REVIEW_COMMENT_STATUSES.has(c.status) &&
    typeof c.title === "string" &&
    typeof c.body === "string"
  );
}

function isPullRequestShape(value: unknown): value is PullRequestReview {
  if (!isObject(value)) return false;
  const c = value as Partial<PullRequestReview>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.branch === "string" &&
    typeof c.base === "string" &&
    typeof c.author === "string" &&
    typeof c.reviewState === "string" &&
    REVIEW_STATES.has(c.reviewState) &&
    typeof c.gate === "string" &&
    MERGE_GATES.has(c.gate) &&
    typeof c.changedFiles === "number" &&
    Number.isInteger(c.changedFiles) &&
    c.changedFiles >= 0 &&
    Array.isArray(c.riskAreas) &&
    c.riskAreas.every((area) => typeof area === "string") &&
    Array.isArray(c.comments) && c.comments.every(isReviewCommentShape) &&
    typeof c.codexCommand === "string"
  );
}

function isBranchWorkstreamShape(value: unknown): value is BranchWorkstream {
  if (!isObject(value)) return false;
  const c = value as Partial<BranchWorkstream>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.branch === "string" &&
    typeof c.base === "string" &&
    typeof c.owner === "string" &&
    typeof c.status === "string" &&
    BRANCH_STATUSES.has(c.status) &&
    typeof c.pullRequest === "string" &&
    typeof c.dueAt === "string" &&
    typeof c.risk === "string" &&
    RISK_LEVELS.has(c.risk) &&
    typeof c.nextAction === "string"
  );
}

function isAgentWorktreeShape(value: unknown): value is AgentWorktree {
  if (!isObject(value)) return false;
  const c = value as Partial<AgentWorktree>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.repository === "string" &&
    typeof c.branch === "string" &&
    typeof c.base === "string" &&
    typeof c.status === "string" &&
    AGENT_WORKTREE_STATUSES.has(c.status) &&
    typeof c.mode === "string" &&
    AGENT_WORKTREE_MODES.has(c.mode) &&
    typeof c.previewUrl === "string" &&
    typeof c.pullRequest === "string" &&
    typeof c.currentStep === "string" &&
    typeof c.nextAction === "string" &&
    typeof c.humanAction === "string" &&
    typeof c.updatedAt === "string"
  );
}

function isNoCodeDevRequestShape(value: unknown): value is NoCodeDevRequest {
  if (!isObject(value)) return false;
  const c = value as Partial<NoCodeDevRequest>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.requester === "string" &&
    typeof c.source === "string" &&
    typeof c.targetRepository === "string" &&
    typeof c.status === "string" &&
    NO_CODE_REQUEST_STATUSES.has(c.status) &&
    typeof c.expectedOutcome === "string" &&
    typeof c.agentPrompt === "string"
  );
}

function isPriorityLevelShape(value: unknown): value is ReviewPriorityLevel {
  if (!isObject(value)) return false;
  const c = value as Partial<ReviewPriorityLevel>;
  return (
    typeof c.priority === "string" &&
    REVIEW_PRIORITIES.has(c.priority) &&
    typeof c.rank === "number" &&
    Number.isInteger(c.rank) &&
    c.rank >= 1 &&
    c.rank <= 4 &&
    typeof c.label === "string" &&
    typeof c.owner === "string" &&
    typeof c.mergeRule === "string" &&
    typeof c.body === "string"
  );
}

function isPolicyShape(value: unknown) {
  if (!isObject(value)) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.value === "string" &&
    typeof c.body === "string"
  );
}

function isPipelineStepShape(value: unknown) {
  if (!isObject(value)) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.body === "string"
  );
}

function isCodeReviewShape(value: unknown): value is CodeReviewSystem {
  if (!isObject(value)) return false;
  const c = value as Partial<CodeReviewSystem>;
  return (
    typeof c.repository === "string" &&
    typeof c.mainBranch === "string" &&
    typeof c.pmOwner === "string" &&
    typeof c.reviewModel === "string" &&
    Array.isArray(c.agentWorktrees) &&
    c.agentWorktrees.every(isAgentWorktreeShape) &&
    Array.isArray(c.noCodeRequests) &&
    c.noCodeRequests.every(isNoCodeDevRequestShape) &&
    Array.isArray(c.branches) && c.branches.every(isBranchWorkstreamShape) &&
    Array.isArray(c.pullRequests) && c.pullRequests.every(isPullRequestShape) &&
    Array.isArray(c.priorityLevels) && c.priorityLevels.every(isPriorityLevelShape) &&
    Array.isArray(c.policies) && c.policies.every(isPolicyShape) &&
    Array.isArray(c.pipeline) && c.pipeline.every(isPipelineStepShape) &&
    Array.isArray(c.checklist) &&
    c.checklist.every((item) => typeof item === "string")
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
