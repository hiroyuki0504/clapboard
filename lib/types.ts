export type ProjectStatus =
  | "planning"
  | "in-progress"
  | "review"
  | "at-risk"
  | "completed";

export type TaskPriority = "high" | "medium" | "low";

export type ProjectTask = {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  note: string;
};

export type ProjectMinute = {
  id: string;
  title: string;
  createdAt: string;
  participants: string[];
  body: string;
};

export type ProjectAmbiguityKind =
  | "missing-assignee"
  | "missing-due-date"
  | "unresolved-decision"
  | "unclear-dependency";

export type ExtractionSuggestionType = "decision" | "task" | "ambiguity";

export type ExtractionSuggestionStatus = "pending" | "accepted" | "rejected";

export type ExtractionSuggestion = {
  id: string;
  type: ExtractionSuggestionType;
  text: string;
  assigneeCandidate?: string;
  dueDateCandidate?: string;
  status: ExtractionSuggestionStatus;
};

export type FinanceTransaction = {
  id: string;
  date: string;
  label: string;
  type: "revenue" | "expense";
  amount: number;
};

export type ProjectFile = {
  id: string;
  name: string;
  type: "docs" | "sheet" | "slide" | "folder" | "pdf";
  updatedAt: string;
  url: string;
};

export type ProjectUpdate = {
  id: string;
  date: string;
  text: string;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  progress: number;
  lastUpdated: string;
  revenue: number;
  cost: number;
  dueDate: string;
  owner: string;
  summary: string;
  updates: ProjectUpdate[];
  tasks: ProjectTask[];
  minutes: ProjectMinute[];
  transactions: FinanceTransaction[];
  files: ProjectFile[];
};
