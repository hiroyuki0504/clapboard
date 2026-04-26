import type {
  AgentRunbook,
  AgentRunbookAgent,
  AgentWorktree,
  BranchWorkstream,
  CodexReviewComment,
  NoCodeDevRequest,
  PullRequestReview,
  ReviewPriorityLevel,
  reviewSystem,
} from "@/lib/code-review-system";
import type {
  FinanceTransaction,
  Project,
  ProjectFile,
  ProjectMinute,
  ProjectTask,
  ProjectUpdate,
} from "@/lib/types";

export type CodeReviewSystem = typeof reviewSystem;

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
const AGENT_RUNBOOK_LAYERS = new Set(["L1", "L2", "L3"]);
const BRANCH_STATUSES = new Set([
  "design",
  "implementing",
  "review-ready",
  "changes-requested",
  "approved",
]);
const RISK_LEVELS = new Set(["low", "medium", "high"]);

const MIN_PROGRESS = 0;
const MAX_PROGRESS = 100;

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

export function isProjectShape(value: unknown): value is Project {
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

function isStringListShape(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isAgentRunbookAgentShape(
  value: unknown,
): value is AgentRunbookAgent {
  if (!isObject(value)) return false;
  const c = value as Partial<AgentRunbookAgent>;
  return (
    typeof c.id === "string" &&
    typeof c.name === "string" &&
    typeof c.layer === "string" &&
    AGENT_RUNBOOK_LAYERS.has(c.layer) &&
    typeof c.hierarchy === "string" &&
    typeof c.reportsTo === "string" &&
    isStringListShape(c.purpose) &&
    isStringListShape(c.responsibilityScope) &&
    isStringListShape(c.implementationArtifacts) &&
    isStringListShape(c.verification) &&
    isStringListShape(c.pullRequestConditions)
  );
}

function isAgentRunbookShape(value: unknown): value is AgentRunbook {
  if (!isObject(value)) return false;
  const c = value as Partial<AgentRunbook>;
  return (
    typeof c.id === "string" &&
    typeof c.title === "string" &&
    typeof c.summary === "string" &&
    Array.isArray(c.agents) &&
    c.agents.length === 4 &&
    c.agents.every(isAgentRunbookAgentShape)
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

export function isCodeReviewShape(value: unknown): value is CodeReviewSystem {
  if (!isObject(value)) return false;
  const c = value as Partial<CodeReviewSystem>;
  return (
    typeof c.repository === "string" &&
    typeof c.mainBranch === "string" &&
    typeof c.pmOwner === "string" &&
    typeof c.reviewModel === "string" &&
    isAgentRunbookShape(c.agentRunbook) &&
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
