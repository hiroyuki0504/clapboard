import {
  type ExtractionSuggestion,
  extractMinuteSuggestions,
} from "./mock-extraction";
import type {
  EditableSuggestion,
  ProjectMinute,
  ProjectTask,
  ReviewSource,
} from "./types";

export function toEditableSuggestions(
  suggestions: ExtractionSuggestion[],
): EditableSuggestion[] {
  return suggestions.map((suggestion) => ({
    ...suggestion,
    draftText: suggestion.text,
    isEditing: false,
  }));
}

export function createReviewSources(minutes: ProjectMinute[]): ReviewSource[] {
  return minutes.map((minute) => ({
    id: minute.id,
    title: minute.title,
    createdAt: minute.createdAt,
    body: minute.body,
    sourceMinuteId: minute.id,
    suggestions: toEditableSuggestions(extractMinuteSuggestions(minute.body)),
  }));
}

export function getPreferredReviewSourceId(sources: ReviewSource[]) {
  return (
    sources.find((source) => getPendingSuggestionCount(source.suggestions) > 0)?.id ??
    sources[0]?.id ??
    null
  );
}

export function getPendingSuggestionCount(
  suggestions: Array<Pick<ExtractionSuggestion, "status">>,
) {
  return suggestions.filter((suggestion) => suggestion.status === "pending").length;
}

export function getSuggestionsByType<T extends Pick<ExtractionSuggestion, "type">>(
  suggestions: T[],
) {
  return {
    decision: suggestions.filter((suggestion) => suggestion.type === "decision"),
    task: suggestions.filter((suggestion) => suggestion.type === "task"),
    ambiguity: suggestions.filter((suggestion) => suggestion.type === "ambiguity"),
  };
}

export function acceptSuggestions(
  suggestions: EditableSuggestion[],
  targetIds: ReadonlySet<string>,
): EditableSuggestion[] {
  if (targetIds.size === 0) {
    return suggestions;
  }

  return suggestions.map((suggestion) => {
    if (!targetIds.has(suggestion.id) || suggestion.status !== "pending") {
      return suggestion;
    }

    const normalizedText = suggestion.draftText.trim();

    if (!normalizedText) {
      return suggestion;
    }

    return {
      ...suggestion,
      text: normalizedText,
      draftText: normalizedText,
      status: "accepted",
      isEditing: false,
    };
  });
}

export function rejectSuggestions(
  suggestions: EditableSuggestion[],
  targetIds: ReadonlySet<string>,
): EditableSuggestion[] {
  if (targetIds.size === 0) {
    return suggestions;
  }

  return suggestions.map((suggestion) => {
    if (!targetIds.has(suggestion.id) || suggestion.status !== "pending") {
      return suggestion;
    }

    return {
      ...suggestion,
      status: "rejected",
      isEditing: false,
    };
  });
}

export function toggleSuggestionEdit(
  suggestions: EditableSuggestion[],
  id: string,
): EditableSuggestion[] {
  return suggestions.map((suggestion) =>
    suggestion.id === id
      ? {
          ...suggestion,
          isEditing:
            suggestion.status === "pending" ? !suggestion.isEditing : false,
        }
      : suggestion,
  );
}

export function updateSuggestionDraft(
  suggestions: EditableSuggestion[],
  id: string,
  draftText: string,
): EditableSuggestion[] {
  return suggestions.map((suggestion) =>
    suggestion.id === id ? { ...suggestion, draftText } : suggestion,
  );
}

export function pickPendingIds(suggestions: EditableSuggestion[]): Set<string> {
  return new Set(
    suggestions
      .filter((suggestion) => suggestion.status === "pending")
      .map((suggestion) => suggestion.id),
  );
}

export function getAcceptedReviewTasks(
  sources: ReviewSource[],
  existingTasks: ProjectTask[],
): ProjectTask[] {
  const seenTitles = new Set(
    existingTasks.map((task) => normalizeTaskTitle(task.title)),
  );
  const acceptedTasks: ProjectTask[] = [];

  sources.forEach((source) => {
    source.suggestions.forEach((suggestion) => {
      if (suggestion.type !== "task" || suggestion.status !== "accepted") {
        return;
      }

      const title = suggestion.draftText.trim();
      const normalizedTitle = normalizeTaskTitle(title);

      if (!normalizedTitle || seenTitles.has(normalizedTitle)) {
        return;
      }

      seenTitles.add(normalizedTitle);
      acceptedTasks.push({
        id: `review-task-${source.id}-${suggestion.id}`,
        title,
        completed: false,
        priority: suggestion.dueDateCandidate ? "high" : "medium",
        note: buildReviewTaskNote(suggestion, source),
      });
    });
  });

  return acceptedTasks;
}

function buildReviewTaskNote(
  suggestion: EditableSuggestion,
  source: ReviewSource,
) {
  const parts = [`議事録レビューから追加: ${source.title}`];

  if (suggestion.assigneeCandidate) {
    parts.push(`担当候補: ${suggestion.assigneeCandidate}`);
  }

  if (suggestion.dueDateCandidate) {
    parts.push(`期限候補: ${suggestion.dueDateCandidate}`);
  }

  return parts.join(" / ");
}

function normalizeTaskTitle(title: string) {
  return title.trim().replace(/\s+/g, " ");
}
