import type { ExtractionSuggestion } from "@/lib/mock-extraction";

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

export type EditableSuggestion = ExtractionSuggestion & {
  draftText: string;
  isEditing: boolean;
};

export type ReviewSource = {
  id: string;
  title: string;
  createdAt: string;
  body: string;
  suggestions: EditableSuggestion[];
  sourceMinuteId?: string;
};
