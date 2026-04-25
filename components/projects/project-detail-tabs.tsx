"use client";

import { useEffect, useMemo, useState } from "react";
import { extractMinuteSuggestions } from "@/lib/mock-extraction";
import {
  getOpenTaskCount,
  getProjectBudgetBalance,
  getTaskCompletion,
} from "@/lib/project-selectors";
import {
  acceptSuggestions,
  createReviewSources,
  getAcceptedReviewTasks,
  getPreferredReviewSourceId,
  getSuggestionsByType,
  pickPendingIds,
  rejectSuggestions,
  toEditableSuggestions,
  toggleSuggestionEdit as toggleSuggestionEditState,
  updateSuggestionDraft as updateSuggestionDraftState,
} from "@/lib/suggestion-state";
import type { EditableSuggestion, Project, ReviewSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FilesTab } from "./detail-tabs/files-tab";
import { FinanceTab } from "./detail-tabs/finance-tab";
import { MinutesTab } from "./detail-tabs/minutes-tab";
import { OverviewTab } from "./detail-tabs/overview-tab";
import { ProgressTab } from "./detail-tabs/progress-tab";
import {
  type ReviewFilter,
  ReviewTab,
} from "./detail-tabs/review-tab";
import {
  type TabKey,
  getTabFromSearch,
  getTabFromValue,
  isTabKey,
  tabs,
} from "./detail-tabs/tab-config";

export function ProjectDetailTabs({
  project,
  initialTab,
}: {
  project: Project;
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    getTabFromValue(initialTab),
  );
  const [reviewError, setReviewError] = useState("");
  const [reviewSources, setReviewSources] = useState<ReviewSource[]>(() =>
    createReviewSources(project.minutes),
  );
  const [selectedReviewSourceId, setSelectedReviewSourceId] = useState<string | null>(
    () => getPreferredReviewSourceId(createReviewSources(project.minutes)),
  );
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>("pending");
  const acceptedReviewTasks = getAcceptedReviewTasks(reviewSources, project.tasks);
  const tasks = [...acceptedReviewTasks, ...project.tasks];
  const profit = getProjectBudgetBalance(project);
  const completion = useMemo(() => getTaskCompletion(tasks), [tasks]);
  const openTaskCount = getOpenTaskCount(tasks);
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab)!;
  const selectedReviewSource =
    reviewSources.find((source) => source.id === selectedReviewSourceId) ??
    reviewSources[0];
  const suggestions = selectedReviewSource?.suggestions ?? [];
  const suggestionStats: Record<ReviewFilter, number> = {
    all: suggestions.length,
    pending: suggestions.filter((suggestion) => suggestion.status === "pending").length,
    accepted: suggestions.filter((suggestion) => suggestion.status === "accepted").length,
    rejected: suggestions.filter((suggestion) => suggestion.status === "rejected").length,
  };
  const filteredSuggestions =
    reviewFilter === "all"
      ? suggestions
      : suggestions.filter((suggestion) => suggestion.status === reviewFilter);
  const visiblePendingSuggestions = filteredSuggestions.filter(
    (suggestion) => suggestion.status === "pending",
  );
  const suggestionsByType = getSuggestionsByType(filteredSuggestions);

  useEffect(() => {
    function syncTabFromUrl() {
      setActiveTab(getTabFromSearch());
    }

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);

    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  useEffect(() => {
    const nextSources = createReviewSources(project.minutes);

    setReviewSources(nextSources);
    setSelectedReviewSourceId(getPreferredReviewSourceId(nextSources));
    setReviewFilter("pending");
    setReviewError("");
  }, [project.id, project.minutes]);

  useEffect(() => {
    document.querySelector<HTMLButtonElement>(
      `[data-project-detail-tab="${activeTab}"]`,
    )?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [activeTab]);

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

  async function handleImportChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();

    if (!extension || !["txt", "md"].includes(extension)) {
      setReviewError("対応しているファイル形式は .txt と .md です。");
      event.target.value = "";
      return;
    }

    const text = await file.text();

    if (!text.trim()) {
      setReviewError("空のファイルは取り込めません。");
      event.target.value = "";
      return;
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
    handleSelectTab("review");
    event.target.value = "";
  }

  function handleSelectTab(tabKey: TabKey) {
    if (tabKey === activeTab) {
      return;
    }

    setActiveTab(tabKey);

    const url = new URL(window.location.href);

    if (tabKey === "overview") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tabKey);
    }

    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function selectAndFocusTab(tabKey: TabKey) {
    handleSelectTab(tabKey);
    window.requestAnimationFrame(() => {
      const tabButton = document.querySelector<HTMLButtonElement>(
        `[data-project-detail-tab="${tabKey}"]`,
      );

      tabButton?.scrollIntoView({ block: "nearest", inline: "center" });
      tabButton?.focus();
    });
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    tabKey: TabKey,
  ) {
    if (!isTabKey(tabKey)) {
      return;
    }

    const currentIndex = tabs.findIndex((tab) => tab.key === tabKey);
    const lastIndex = tabs.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    selectAndFocusTab(tabs[nextIndex].key);
  }

  function handleSelectReviewSource(sourceId: string) {
    setSelectedReviewSourceId(sourceId);
    setReviewError("");
  }

  function handleAcceptSuggestion(suggestion: EditableSuggestion) {
    applyToSelectedSource((current) =>
      acceptSuggestions(current, new Set([suggestion.id])),
    );
  }

  function handleRejectSuggestion(suggestionId: string) {
    applyToSelectedSource((current) =>
      rejectSuggestions(current, new Set([suggestionId])),
    );
  }

  function handleAcceptVisible() {
    const ids = pickPendingIds(visiblePendingSuggestions);
    applyToSelectedSource((current) => acceptSuggestions(current, ids));
  }

  function handleRejectVisible() {
    const ids = pickPendingIds(visiblePendingSuggestions);
    applyToSelectedSource((current) => rejectSuggestions(current, ids));
  }

  function handleToggleEdit(suggestionId: string) {
    applyToSelectedSource((current) =>
      toggleSuggestionEditState(current, suggestionId),
    );
  }

  function handleDraftChange(suggestionId: string, draftText: string) {
    applyToSelectedSource((current) =>
      updateSuggestionDraftState(current, suggestionId, draftText),
    );
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="進捗詳細のタブ"
        className="flex gap-1 overflow-x-auto rounded-lg border border-[#423c33]/55 bg-[#f3f0e7] p-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              data-project-detail-tab={tab.key}
              onClick={() => handleSelectTab(tab.key)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
              className={cn(
                "inline-flex h-10 min-w-[88px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-bold text-[#70675b] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c95d3a] sm:flex-1 sm:px-4",
                active && "bg-[#312d27] text-white shadow-sm",
                !active && "hover:bg-[#fffefa] hover:text-[#312d27]",
              )}
              type="button"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[#81786d]" aria-live="polite">
        現在表示中:{" "}
        <strong className="text-[#5f574d]">{activeTabMeta.label}</strong> -{" "}
        {activeTabMeta.description}
      </p>

      {activeTab === "overview" && <OverviewTab project={project} />}

      {activeTab === "review" && (
        <ReviewTab
          reviewSources={reviewSources}
          selectedReviewSource={selectedReviewSource}
          reviewError={reviewError}
          reviewFilter={reviewFilter}
          suggestionStats={suggestionStats}
          suggestionsByType={suggestionsByType}
          visiblePendingCount={visiblePendingSuggestions.length}
          onImportChange={handleImportChange}
          onSelectReviewSource={handleSelectReviewSource}
          onFilterChange={setReviewFilter}
          onAcceptVisible={handleAcceptVisible}
          onRejectVisible={handleRejectVisible}
          onAcceptSuggestion={handleAcceptSuggestion}
          onRejectSuggestion={handleRejectSuggestion}
          onToggleEdit={handleToggleEdit}
          onDraftChange={handleDraftChange}
        />
      )}

      {activeTab === "progress" && (
        <ProgressTab
          tasks={tasks}
          completion={completion}
          openTaskCount={openTaskCount}
        />
      )}

      {activeTab === "minutes" && <MinutesTab minutes={project.minutes} />}

      {activeTab === "finance" && (
        <FinanceTab project={project} profit={profit} />
      )}

      {activeTab === "files" && <FilesTab files={project.files} />}
    </div>
  );
}
