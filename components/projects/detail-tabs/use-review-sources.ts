"use client";

import { useEffect, useState } from "react";
import { extractMinuteSuggestions } from "@/lib/mock-extraction";
import {
  acceptSuggestions,
  createReviewSources,
  getPreferredReviewSourceId,
  getSuggestionsByType,
  pickPendingIds,
  rejectSuggestions,
  toEditableSuggestions,
  toggleSuggestionEdit as toggleSuggestionEditState,
  updateSuggestionDraft as updateSuggestionDraftState,
} from "@/lib/suggestion-state";
import type {
  EditableSuggestion,
  Project,
  ReviewSource,
} from "@/lib/types";
import type { ReviewFilter } from "./review-tab";

export type ReviewSourcesController = ReturnType<typeof useReviewSources>;

export function useReviewSources(
  project: Pick<Project, "id" | "minutes">,
) {
  const [reviewError, setReviewError] = useState("");
  const [reviewSources, setReviewSources] = useState<ReviewSource[]>(() =>
    createReviewSources(project.minutes),
  );
  const [selectedReviewSourceId, setSelectedReviewSourceId] = useState<
    string | null
  >(() => getPreferredReviewSourceId(createReviewSources(project.minutes)));
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("pending");

  useEffect(() => {
    const nextSources = createReviewSources(project.minutes);

    setReviewSources(nextSources);
    setSelectedReviewSourceId(getPreferredReviewSourceId(nextSources));
    setReviewFilter("pending");
    setReviewError("");
  }, [project.id, project.minutes]);

  const selectedReviewSource =
    reviewSources.find((source) => source.id === selectedReviewSourceId) ??
    reviewSources[0];
  const suggestions = selectedReviewSource?.suggestions ?? [];
  const suggestionStats: Record<ReviewFilter, number> = {
    all: suggestions.length,
    pending: suggestions.filter((suggestion) => suggestion.status === "pending")
      .length,
    accepted: suggestions.filter(
      (suggestion) => suggestion.status === "accepted",
    ).length,
    rejected: suggestions.filter(
      (suggestion) => suggestion.status === "rejected",
    ).length,
  };
  const filteredSuggestions =
    reviewFilter === "all"
      ? suggestions
      : suggestions.filter((suggestion) => suggestion.status === reviewFilter);
  const visiblePendingSuggestions = filteredSuggestions.filter(
    (suggestion) => suggestion.status === "pending",
  );
  const suggestionsByType = getSuggestionsByType(filteredSuggestions);

  function applyToSelectedSource(
    transform: (suggestions: EditableSuggestion[]) => EditableSuggestion[],
  ) {
    if (!selectedReviewSource) {
      return;
    }

    setReviewSources((current) =>
      current.map((source) =>
        source.id === selectedReviewSource.id
          ? { ...source, suggestions: transform(source.suggestions) }
          : source,
      ),
    );
  }

  function selectReviewSource(sourceId: string) {
    setSelectedReviewSourceId(sourceId);
    setReviewError("");
  }

  function acceptSuggestion(suggestion: EditableSuggestion) {
    applyToSelectedSource((current) =>
      acceptSuggestions(current, new Set([suggestion.id])),
    );
  }

  function rejectSuggestion(suggestionId: string) {
    applyToSelectedSource((current) =>
      rejectSuggestions(current, new Set([suggestionId])),
    );
  }

  function acceptVisible() {
    const ids = pickPendingIds(visiblePendingSuggestions);
    applyToSelectedSource((current) => acceptSuggestions(current, ids));
  }

  function rejectVisible() {
    const ids = pickPendingIds(visiblePendingSuggestions);
    applyToSelectedSource((current) => rejectSuggestions(current, ids));
  }

  function toggleEdit(suggestionId: string) {
    applyToSelectedSource((current) =>
      toggleSuggestionEditState(current, suggestionId),
    );
  }

  function updateDraft(suggestionId: string, draftText: string) {
    applyToSelectedSource((current) =>
      updateSuggestionDraftState(current, suggestionId, draftText),
    );
  }

  async function importMinuteFile(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["txt", "md"].includes(extension)) {
      setReviewError("対応しているファイル形式は .txt と .md です。");
      return null;
    }

    const text = await file.text();

    if (!text.trim()) {
      setReviewError("空のファイルは取り込めません。");
      return null;
    }

    const createdAt = new Date().toISOString();
    const nextSource: ReviewSource = {
      id: `local-${Date.now()}`,
      title: file.name,
      createdAt,
      body: text,
      suggestions: toEditableSuggestions(extractMinuteSuggestions(text)),
    };

    setReviewError("");
    setReviewSources((current) => [nextSource, ...current]);
    setSelectedReviewSourceId(nextSource.id);
    setReviewFilter("pending");
    return nextSource;
  }

  return {
    reviewSources,
    selectedReviewSource,
    reviewError,
    reviewFilter,
    setReviewFilter,
    suggestionStats,
    suggestionsByType,
    visiblePendingCount: visiblePendingSuggestions.length,
    selectReviewSource,
    acceptSuggestion,
    rejectSuggestion,
    acceptVisible,
    rejectVisible,
    toggleEdit,
    updateDraft,
    importMinuteFile,
  };
}
