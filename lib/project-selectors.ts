import type {
  ExtractionSuggestion,
  MinuteImport,
  Project,
  ProjectAmbiguity,
  ProjectDecision,
  ProjectMinute,
  ProjectTask,
} from "@/lib/types";

export function getProjectProfit(project: Pick<Project, "revenue" | "cost">) {
  return project.revenue - project.cost;
}

export function getTaskCompletion(tasks: ProjectTask[]) {
  const completed = tasks.filter((task) => task.completed).length;

  if (tasks.length === 0) {
    return 0;
  }

  return Math.round((completed / tasks.length) * 100);
}

export function getIncompleteTaskCount(tasks: ProjectTask[]) {
  return tasks.filter((task) => !task.completed).length;
}

export function getUnresolvedAmbiguities(ambiguities: ProjectAmbiguity[]) {
  return ambiguities.filter((ambiguity) => !ambiguity.resolved);
}

export function getLatestDecisions(decisions: ProjectDecision[], limit = 3) {
  return [...decisions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

export function getSuggestionsByType<
  T extends Pick<ExtractionSuggestion, "type">,
>(suggestions: T[]) {
  return {
    decision: suggestions.filter((suggestion) => suggestion.type === "decision"),
    task: suggestions.filter((suggestion) => suggestion.type === "task"),
    ambiguity: suggestions.filter((suggestion) => suggestion.type === "ambiguity"),
  };
}

export function getLatestImport(project: Pick<Project, "imports">) {
  return getSortedImports(project.imports)[0];
}

export function getImportById(
  project: Pick<Project, "imports">,
  importId: string | null,
) {
  if (!importId) {
    return undefined;
  }

  return project.imports.find((entry) => entry.id === importId);
}

export function getSortedImports(imports: MinuteImport[]) {
  return [...imports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getPendingImportSuggestionCount(entry: MinuteImport) {
  return (entry.suggestions ?? []).filter(
    (suggestion) => suggestion.status === "pending",
  ).length;
}

export function getPreferredReviewImportId(imports: MinuteImport[]) {
  const pendingImport = getSortedImports(imports).find(
    (entry) =>
      entry.extractionStatus !== "reviewed" ||
      getPendingImportSuggestionCount(entry) > 0,
  );

  return pendingImport?.id ?? getSortedImports(imports)[0]?.id ?? null;
}

export function getImportSourceBody(
  project: Pick<Project, "minutes">,
  minuteImport?: MinuteImport,
) {
  if (!minuteImport) {
    return "";
  }

  const sourceMinute = minuteImport.sourceMinuteId
    ? project.minutes.find((minute) => minute.id === minuteImport.sourceMinuteId)
    : undefined;

  return sourceMinute?.body ?? minuteImport.body;
}

export function getLatestSourceMinuteId(minutes: ProjectMinute[]) {
  return [...minutes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]?.id ?? "manual-import";
}
