export type BranchWorkstreamStatus =
  | "design"
  | "implementing"
  | "review-ready"
  | "changes-requested"
  | "approved";

export type ReviewState = "queued" | "running" | "needs-fix" | "passed";

export type MergeGate = "open" | "blocked" | "ready";

export type ReviewPriority = "crucial" | "high" | "medium" | "low";

export type ReviewCommentStatus = "open" | "fixed" | "accepted-risk";

export type AgentWorktreeStatus =
  | "queued"
  | "building"
  | "preview-ready"
  | "pr-ready";

export type AgentWorktreeMode =
  | "prompt-to-branch"
  | "issue-to-pr"
  | "design-to-ui";

export type NoCodeRequestStatus = "intake" | "scoped" | "building" | "ready";

export type AgentRunbook = {
  id: string;
  title: string;
  summary: string;
  agents: AgentRunbookAgent[];
};

export type AgentRunbookAgent = {
  id: string;
  name: string;
  layer: "L1" | "L2" | "L3";
  hierarchy: string;
  reportsTo: string;
  purpose: string[];
  responsibilityScope: string[];
  implementationArtifacts: string[];
  verification: string[];
  pullRequestConditions: string[];
};

export type ReviewPriorityLevel = {
  priority: ReviewPriority;
  rank: 1 | 2 | 3 | 4;
  label: string;
  owner: "PR作成者" | "PM判断";
  mergeRule: string;
  body: string;
};

export type CodexReviewComment = {
  id: string;
  priority: ReviewPriority;
  status: ReviewCommentStatus;
  title: string;
  body: string;
};

export type BranchWorkstream = {
  id: string;
  title: string;
  branch: string;
  base: string;
  owner: string;
  status: BranchWorkstreamStatus;
  pullRequest: string;
  dueAt: string;
  risk: "low" | "medium" | "high";
  nextAction: string;
};

export type PullRequestReview = {
  id: string;
  title: string;
  branch: string;
  base: string;
  author: string;
  reviewState: ReviewState;
  gate: MergeGate;
  changedFiles: number;
  riskAreas: string[];
  comments: CodexReviewComment[];
  codexCommand: string;
};

export type AgentWorktree = {
  id: string;
  title: string;
  repository: string;
  branch: string;
  base: string;
  status: AgentWorktreeStatus;
  mode: AgentWorktreeMode;
  previewUrl: string;
  pullRequest: string;
  currentStep: string;
  nextAction: string;
  humanAction: string;
  updatedAt: string;
};

export type NoCodeDevRequest = {
  id: string;
  title: string;
  requester: string;
  source: string;
  targetRepository: string;
  status: NoCodeRequestStatus;
  expectedOutcome: string;
  agentPrompt: string;
};

export { reviewSystem } from "./code-review-mock";
