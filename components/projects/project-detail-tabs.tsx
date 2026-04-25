"use client";

import { useMemo } from "react";
import {
  getOpenTaskCount,
  getProjectBudgetBalance,
  getTaskCompletion,
} from "@/lib/project-selectors";
import { getAcceptedReviewTasks } from "@/lib/suggestion-state";
import type { Project } from "@/lib/types";
import { FilesTab } from "./detail-tabs/files-tab";
import { FinanceTab } from "./detail-tabs/finance-tab";
import { MinutesTab } from "./detail-tabs/minutes-tab";
import { OverviewTab } from "./detail-tabs/overview-tab";
import { ProgressTab } from "./detail-tabs/progress-tab";
import { ReviewTab } from "./detail-tabs/review-tab";
import { ProjectDetailTabButton } from "./detail-tabs/tab-button";
import { tabs } from "./detail-tabs/tab-config";
import { useReviewSources } from "./detail-tabs/use-review-sources";
import { useTabNavigation } from "./detail-tabs/use-tab-navigation";

export function ProjectDetailTabs({
  project,
  initialTab,
}: {
  project: Project;
  initialTab?: string;
}) {
  const { activeTab, selectTab, handleTabKeyDown } =
    useTabNavigation(initialTab);
  const review = useReviewSources(project);

  const acceptedReviewTasks = getAcceptedReviewTasks(
    review.reviewSources,
    project.tasks,
  );
  const tasks = [...acceptedReviewTasks, ...project.tasks];
  const profit = getProjectBudgetBalance(project);
  const completion = useMemo(() => getTaskCompletion(tasks), [tasks]);
  const openTaskCount = getOpenTaskCount(tasks);
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab)!;

  async function handleImportChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    const next = await review.importMinuteFile(file);
    if (next) {
      selectTab("review");
    }
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="進捗詳細のタブ"
        className="flex gap-1 overflow-x-auto rounded-lg border border-[#423c33]/55 bg-[#f3f0e7] p-1"
      >
        {tabs.map((tab) => (
          <ProjectDetailTabButton
            key={tab.key}
            tabKey={tab.key}
            label={tab.label}
            icon={tab.icon}
            active={activeTab === tab.key}
            onSelect={() => selectTab(tab.key)}
            onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
          />
        ))}
      </div>

      <p className="text-xs text-[#81786d]" aria-live="polite">
        現在表示中:{" "}
        <strong className="text-[#5f574d]">{activeTabMeta.label}</strong> -{" "}
        {activeTabMeta.description}
      </p>

      {activeTab === "overview" && <OverviewTab project={project} />}

      {activeTab === "review" && (
        <ReviewTab
          reviewSources={review.reviewSources}
          selectedReviewSource={review.selectedReviewSource}
          reviewError={review.reviewError}
          reviewFilter={review.reviewFilter}
          suggestionStats={review.suggestionStats}
          suggestionsByType={review.suggestionsByType}
          visiblePendingCount={review.visiblePendingCount}
          onImportChange={handleImportChange}
          onSelectReviewSource={review.selectReviewSource}
          onFilterChange={review.setReviewFilter}
          onAcceptVisible={review.acceptVisible}
          onRejectVisible={review.rejectVisible}
          onAcceptSuggestion={review.acceptSuggestion}
          onRejectSuggestion={review.rejectSuggestion}
          onToggleEdit={review.toggleEdit}
          onDraftChange={review.updateDraft}
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
