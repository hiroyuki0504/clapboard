"use client";

import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileText,
  FolderOpen,
  Landmark,
  ListChecks,
  Upload,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PriorityBadge, ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  extractMinuteSuggestions,
  type ExtractionSuggestion,
} from "@/lib/mock-extraction";
import type { Project, ProjectMinute, ProjectTask } from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  safeFileUrl,
} from "@/lib/utils";

type TabKey = "overview" | "review" | "progress" | "minutes" | "finance" | "files";

type ReviewFilter = "all" | ExtractionSuggestion["status"];

type EditableSuggestion = ExtractionSuggestion & {
  draftText: string;
  isEditing: boolean;
};

type ReviewSource = {
  id: string;
  title: string;
  createdAt: string;
  body: string;
  suggestions: EditableSuggestion[];
  sourceMinuteId?: string;
};

const tabs: {
  key: TabKey;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: "overview",
    label: "概要",
    description: "状態・進捗・次の節目・担当者の確認",
    icon: FileText,
  },
  {
    key: "review",
    label: "レビュー",
    description: "議事録から抽出した候補の確認と一括処理",
    icon: ListChecks,
  },
  {
    key: "progress",
    label: "タスク",
    description: "未完了タスクと完了タスクの一覧",
    icon: ListChecks,
  },
  {
    key: "minutes",
    label: "議事録",
    description: "打ち合わせや進捗メモの記録",
    icon: UsersRound,
  },
  {
    key: "finance",
    label: "予算",
    description: "予算・消化・余力と履歴",
    icon: Landmark,
  },
  {
    key: "files",
    label: "ファイル",
    description: "Google Drive など外部ファイルのリンク",
    icon: FolderOpen,
  },
];

const reviewFilterOptions: { key: ReviewFilter; label: string }[] = [
  { key: "pending", label: "未処理" },
  { key: "all", label: "すべて" },
  { key: "accepted", label: "採用済み" },
  { key: "rejected", label: "却下済み" },
];

export function ProjectDetailTabs({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
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
  const profit = project.revenue - project.cost;
  const completion = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter((task) => task.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);
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
      setActiveTab(getTabKeyFromSearch() ?? "overview");
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

  async function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
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
    setActiveTab(tabKey);

    const url = new URL(window.location.href);

    if (tabKey === "overview") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tabKey);
    }

    window.history.pushState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function handleSelectReviewSource(sourceId: string) {
    setSelectedReviewSourceId(sourceId);
    setReviewError("");
  }

  function updateReviewSuggestions(
    updater: (suggestion: EditableSuggestion) => EditableSuggestion,
  ) {
    if (!selectedReviewSource) {
      return;
    }

    setReviewSources((current) =>
      current.map((source) =>
        source.id === selectedReviewSource.id
          ? {
              ...source,
              suggestions: source.suggestions.map(updater),
            }
          : source,
      ),
    );
  }

  function updateSuggestion(
    suggestionId: string,
    updater: (suggestion: EditableSuggestion) => EditableSuggestion,
  ) {
    updateReviewSuggestions((suggestion) =>
      suggestion.id === suggestionId ? updater(suggestion) : suggestion,
    );
  }

  function handleAcceptSuggestion(suggestion: EditableSuggestion) {
    handleAcceptSuggestions([suggestion]);
  }

  function handleAcceptSuggestions(targetSuggestions: EditableSuggestion[]) {
    const acceptedSuggestionIds = new Set(
      targetSuggestions
        .filter((suggestion) => suggestion.status === "pending")
        .map((suggestion) => suggestion.id),
    );

    if (acceptedSuggestionIds.size === 0) {
      return;
    }

    updateReviewSuggestions((suggestion) => {
      if (!acceptedSuggestionIds.has(suggestion.id)) {
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

  function handleRejectSuggestion(suggestionId: string) {
    handleRejectSuggestions(
      suggestions.filter((suggestion) => suggestion.id === suggestionId),
    );
  }

  function handleRejectSuggestions(targetSuggestions: EditableSuggestion[]) {
    const rejectedSuggestionIds = new Set(
      targetSuggestions
        .filter((suggestion) => suggestion.status === "pending")
        .map((suggestion) => suggestion.id),
    );

    if (rejectedSuggestionIds.size === 0) {
      return;
    }

    updateReviewSuggestions((suggestion) =>
      rejectedSuggestionIds.has(suggestion.id)
        ? {
            ...suggestion,
            status: "rejected",
            isEditing: false,
          }
        : suggestion,
    );
  }

  function toggleSuggestionEdit(suggestionId: string) {
    updateSuggestion(suggestionId, (suggestion) => ({
      ...suggestion,
      isEditing: suggestion.status === "pending" ? !suggestion.isEditing : false,
    }));
  }

  function updateSuggestionDraft(suggestionId: string, draftText: string) {
    updateSuggestion(suggestionId, (suggestion) => ({
      ...suggestion,
      draftText,
    }));
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
              onClick={() => handleSelectTab(tab.key)}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-[#70675b] transition",
                active && "bg-[#312d27] text-white shadow-sm",
                !active && "hover:bg-[#fffefa] hover:text-[#312d27]",
              )}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden />
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

      {activeTab === "overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>進捗概要</CardTitle>
                <p className="mt-1 text-sm text-[#81786d]">
                  状態、進捗率、次の節目、担当者を確認します。
                </p>
              </div>
              <ProjectStatusBadge status={project.status} />
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-[#5f574d]">{project.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={CalendarClock}
                  label="次の節目"
                  value={formatDate(project.dueDate)}
                />
                <InfoTile icon={UsersRound} label="担当者" value={project.owner} />
              </div>
              <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#312d27]">進捗率</span>
                  <span className="font-mono text-sm font-bold text-[#312d27]">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>進捗ログ</CardTitle>
              <span className="text-xs text-[#81786d]">
                {project.updates.length}件
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.updates.length === 0 ? (
                <EmptyState
                  title="更新履歴はありません"
                  description="進捗に動きがあるとここに記録されます。"
                />
              ) : (
                project.updates.map((update) => (
                  <div
                    key={update.id}
                    className="border-l-2 border-[#cf623d] bg-[#f8efe8] px-4 py-3"
                  >
                    <p className="font-mono text-xs font-bold text-[#9a4a31]">
                      {formatDateTime(update.date)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5f574d]">
                      {update.text}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "review" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>議事録レビュー</CardTitle>
                <p className="mt-1 text-sm text-[#81786d]">
                  議事録から抽出した候補を確認し、表示中の未処理候補をまとめて処理します。
                </p>
              </div>
              <label className="inline-flex cursor-pointer">
                <input
                  className="sr-only"
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={handleImportChange}
                />
                <span className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#bfb6a8] bg-[#fffefa] px-4 text-sm font-semibold text-[#312d27] transition hover:border-[#8f8678] hover:bg-[#f6f1e7]">
                  <Upload className="h-4 w-4" aria-hidden />
                  議事録を取り込む
                </span>
              </label>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewError && (
                <div className="rounded-md border border-[#e2ac98] bg-[#f8d8cb] px-4 py-3 text-sm text-[#9f452c]">
                  {reviewError}
                </div>
              )}
              {reviewSources.length === 0 ? (
                <EmptyState
                  title="レビュー対象の議事録はありません"
                  description="議事録を取り込むと、抽出候補を確認できます。"
                />
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                    レビュー対象
                  </p>
                  <div className="space-y-2">
                    {reviewSources.map((source) => {
                      const isActive = source.id === selectedReviewSource?.id;
                      const pendingCount = getPendingSuggestionCount(source.suggestions);

                      return (
                        <button
                          key={source.id}
                          type="button"
                          onClick={() => handleSelectReviewSource(source.id)}
                          className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-md border px-3 py-3 text-left transition",
                            isActive
                              ? "border-[#c95d3a] bg-[#fff4ef]"
                              : "border-[#d8d1c4] bg-[#fbfaf5] hover:border-[#b9b0a3]",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#312d27]">
                              {source.title}
                            </p>
                            <p className="mt-1 text-xs text-[#81786d]">
                              {formatDateTime(source.createdAt)}
                            </p>
                          </div>
                          <Badge tone={pendingCount > 0 ? "amber" : "green"}>
                            {pendingCount > 0
                              ? `${pendingCount}件待ち`
                              : "レビュー済み"}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>元の議事録</CardTitle>
                <span className="text-xs text-[#81786d]">source</span>
              </CardHeader>
              <CardContent>
                {selectedReviewSource ? (
                  <MarkdownLike body={selectedReviewSource.body} />
                ) : (
                  <EmptyState
                    title="議事録は未選択です"
                    description="レビュー対象を選ぶと本文を表示します。"
                  />
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <ReviewControls
                filter={reviewFilter}
                stats={suggestionStats}
                visiblePendingCount={visiblePendingSuggestions.length}
                onFilterChange={setReviewFilter}
                onAcceptVisible={() => handleAcceptSuggestions(visiblePendingSuggestions)}
                onRejectVisible={() => handleRejectSuggestions(visiblePendingSuggestions)}
              />
              <SuggestionSection
                title="決定事項"
                suggestions={suggestionsByType.decision}
                sourceBody={selectedReviewSource?.body ?? ""}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onToggleEdit={toggleSuggestionEdit}
                onDraftChange={updateSuggestionDraft}
              />
              <SuggestionSection
                title="ToDo"
                suggestions={suggestionsByType.task}
                sourceBody={selectedReviewSource?.body ?? ""}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onToggleEdit={toggleSuggestionEdit}
                onDraftChange={updateSuggestionDraft}
              />
              <SuggestionSection
                title="未確定事項"
                suggestions={suggestionsByType.ambiguity}
                sourceBody={selectedReviewSource?.body ?? ""}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onToggleEdit={toggleSuggestionEdit}
                onDraftChange={updateSuggestionDraft}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "progress" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>進捗タスク</CardTitle>
              <p className="mt-1 text-sm text-[#81786d]">
                完了率 {completion}% ・ 未完了{" "}
                {tasks.filter((task) => !task.completed).length}件
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {tasks.length === 0 && (
              <EmptyState
                title="タスクはまだありません"
                description="このワークにはタスクが登録されていません。"
              />
            )}
            {tasks.map((task) => (
              <div
                key={task.id}
                className="grid gap-4 border-b border-dashed border-[#d8d1c4] px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  {task.completed ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#5f8b5b]"
                      aria-label="完了"
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#9a9084]"
                      aria-label="未完了"
                    />
                  )}
                  <div>
                    <p
                      className={cn(
                        "font-bold text-[#312d27]",
                        task.completed && "text-[#9a9084] line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#70675b]">
                      {task.note}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <PriorityBadge priority={task.priority} />
                  <Badge tone={task.completed ? "green" : "slate"}>
                    {task.completed ? "完了" : "未完了"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "minutes" && (
        <div className="space-y-4" id="minutes">
          {project.minutes.length === 0 && (
            <Card>
              <CardContent>
                <EmptyState
                  title="議事録はまだありません"
                  description="打ち合わせの記録はここに保存されます。"
                />
              </CardContent>
            </Card>
          )}
          {project.minutes.map((minute) => (
            <Card key={minute.id}>
              <CardHeader>
                <div>
                  <CardTitle>{minute.title}</CardTitle>
                  <p className="mt-1 text-sm text-[#81786d]">
                    {formatDateTime(minute.createdAt)} ・ 参加者{" "}
                    {minute.participants.join(" / ")}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <MarkdownLike body={minute.body} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "finance" && (
        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]" id="finance">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <FinanceTile
              label="予算"
              value={formatCurrency(project.revenue)}
              tone="blue"
            />
            <FinanceTile
              label="消化"
              value={formatCurrency(project.cost)}
              tone="amber"
            />
            <FinanceTile
              label="余力"
              value={formatCurrency(profit)}
              tone={profit >= 0 ? "green" : "rose"}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>予算履歴</CardTitle>
              <span className="text-xs text-[#81786d]">
                {project.transactions.length}件
              </span>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {project.transactions.length === 0 ? (
                <EmptyState
                  title="予算履歴はまだありません"
                  description="予算や消化額を登録するとここに表示されます。"
                />
              ) : (
                <table className="w-full min-w-[620px]">
                  <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                    <tr>
                      <th scope="col" className="px-5 py-4">
                        日付
                      </th>
                      <th scope="col" className="px-5 py-4">
                        内容
                      </th>
                      <th scope="col" className="px-5 py-4">
                        種別
                      </th>
                      <th scope="col" className="px-5 py-4 text-right">
                        金額
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="border-t border-[#ded6ca] px-5 py-4 text-sm text-[#70675b]">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="border-t border-[#ded6ca] px-5 py-4 font-bold text-[#312d27]">
                          {transaction.label}
                        </td>
                        <td className="border-t border-[#ded6ca] px-5 py-4">
                          <Badge
                            tone={
                              transaction.type === "revenue" ? "green" : "amber"
                            }
                          >
                            {transaction.type === "revenue" ? "予算" : "消化"}
                          </Badge>
                        </td>
                        <td className="border-t border-[#ded6ca] px-5 py-4 text-right font-bold text-[#312d27]">
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "files" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Google Drive URL管理</CardTitle>
              <p className="mt-1 text-sm text-[#81786d]">
                進捗に紐づく外部URLを表示します。安全なURLだけ新しいタブで開けます。
              </p>
            </div>
            <span className="text-xs text-[#81786d]">{project.files.length}件</span>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {project.files.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState
                  title="ファイルはまだありません"
                  description="このワークにはまだ外部ファイルが登録されていません。"
                />
              </div>
            )}
            {project.files.map((file) => {
              const safeUrl = safeFileUrl(file.url);
              const cardClass =
                "group rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4 transition hover:border-[#c95d3a] hover:bg-[#fffefa]";
              const inner = (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone="blue">{file.type.toUpperCase()}</Badge>
                    <p className="mt-3 font-bold text-[#312d27]">{file.name}</p>
                    <p className="mt-1 text-sm text-[#70675b]">
                      更新日 {formatDateTime(file.updatedAt)}
                    </p>
                    {!safeUrl && (
                      <p className="mt-2 text-xs font-bold text-[#9a4a31]">
                        URL不正のためリンクを無効化しています
                      </p>
                    )}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[#9a9084] transition group-hover:text-[#c95d3a]" />
                </div>
              );

              if (!safeUrl) {
                return (
                  <div key={file.id} className={cardClass}>
                    {inner}
                  </div>
                );
              }

              return (
                <a
                  key={file.id}
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cardClass}
                  aria-label={`${file.name}を新しいタブで開く`}
                >
                  {inner}
                </a>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewControls({
  filter,
  stats,
  visiblePendingCount,
  onFilterChange,
  onAcceptVisible,
  onRejectVisible,
}: {
  filter: ReviewFilter;
  stats: Record<ReviewFilter, number>;
  visiblePendingCount: number;
  onFilterChange: (filter: ReviewFilter) => void;
  onAcceptVisible: () => void;
  onRejectVisible: () => void;
}) {
  const hasPendingVisible = visiblePendingCount > 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>レビュー操作</CardTitle>
          <p className="mt-1 text-sm text-[#81786d]">
            表示対象を絞り込み、未処理の候補をまとめて処理します。
          </p>
        </div>
        <Badge tone={hasPendingVisible ? "amber" : "green"}>
          未処理 {visiblePendingCount}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {reviewFilterOptions.map((option) => (
            <Button
              key={option.key}
              variant={filter === option.key ? "primary" : "secondary"}
              className="h-8 px-3 text-xs"
              onClick={() => onFilterChange(option.key)}
            >
              {option.label}
              <span className="font-mono">{stats[option.key]}</span>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3">
          <Button
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onAcceptVisible}
            disabled={!hasPendingVisible}
          >
            表示中を一括採用
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onRejectVisible}
            disabled={!hasPendingVisible}
          >
            表示中を一括却下
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SuggestionSection({
  title,
  suggestions,
  sourceBody,
  onAccept,
  onReject,
  onToggleEdit,
  onDraftChange,
}: {
  title: string;
  suggestions: EditableSuggestion[];
  sourceBody: string;
  onAccept: (suggestion: EditableSuggestion) => void;
  onReject: (suggestionId: string) => void;
  onToggleEdit: (suggestionId: string) => void;
  onDraftChange: (suggestionId: string, draftText: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <Badge tone="slate">{suggestions.length}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.length === 0 && (
          <EmptyState
            title={`${title} の候補はありません`}
            description="フィルタ条件に合う候補はありません。"
          />
        )}
        {suggestions.map((suggestion) => {
          const sourceContext = getSuggestionContext(suggestion, sourceBody);

          return (
            <div
              key={suggestion.id}
              className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge tone={statusToneMap[suggestion.status]}>
                  {statusLabelMap[suggestion.status]}
                </Badge>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onToggleEdit(suggestion.id)}
                    disabled={suggestion.status !== "pending"}
                  >
                    編集
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onReject(suggestion.id)}
                    disabled={suggestion.status !== "pending"}
                  >
                    却下
                  </Button>
                  <Button
                    className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                    onClick={() => onAccept(suggestion)}
                    disabled={suggestion.status !== "pending"}
                  >
                    採用
                  </Button>
                </div>
              </div>

              {suggestion.isEditing ? (
                <textarea
                  className="mt-3 min-h-24 w-full rounded-md border border-[#d8d1c4] bg-white px-3 py-2 text-sm text-[#312d27] outline-none ring-0"
                  value={suggestion.draftText}
                  onChange={(event) =>
                    onDraftChange(suggestion.id, event.target.value)
                  }
                />
              ) : (
                <p className="mt-3 text-sm leading-6 text-[#5f574d]">
                  {suggestion.draftText}
                </p>
              )}

              {sourceContext && (
                <div className="mt-3 rounded-md border border-[#e2dacd] bg-[#fffefa] px-3 py-2">
                  <p className="text-xs font-bold text-[#81786d]">
                    元議事録の文脈
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-5 text-[#70675b]">
                    {sourceContext}
                  </pre>
                </div>
              )}

              {(suggestion.assigneeCandidate || suggestion.dueDateCandidate) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestion.assigneeCandidate && (
                    <Badge tone="blue">
                      担当候補 {suggestion.assigneeCandidate}
                    </Badge>
                  )}
                  {suggestion.dueDateCandidate && (
                    <Badge tone="amber">
                      期限候補 {suggestion.dueDateCandidate}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function getTabKeyFromSearch(): TabKey | null {
  if (typeof window === "undefined") {
    return null;
  }

  const tab = new URLSearchParams(window.location.search).get("tab");

  return isTabKey(tab) ? tab : null;
}

function isTabKey(value: string | null): value is TabKey {
  return tabs.some((tab) => tab.key === value);
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#d8d1c4] bg-[#fffefa] text-[#c95d3a]">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
        {label}
      </p>
      <p className="mt-1 font-bold text-[#312d27]">{value}</p>
    </div>
  );
}

function FinanceTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green" | "rose";
}) {
  const toneClass = {
    blue: "bg-[#eef4f8] border-[#a8bed4]",
    amber: "bg-[#fff3c8] border-[#d4bd7f]",
    green: "bg-[#edf5ea] border-[#a8c3a6]",
    rose: "bg-[#f8d8cb] border-[#e2ac98]",
  };

  return (
    <div className={cn("rounded-lg border p-4", toneClass[tone])}>
      <p className="text-sm font-bold text-[#70675b]">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-sm font-bold text-[#5f574d]">{title}</p>
      <p className="text-xs text-[#81786d]">{description}</p>
    </div>
  );
}

function MarkdownLike({ body }: { body: string }) {
  return (
    <div className="space-y-3 rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-5 text-sm leading-7 text-[#5f574d]">
      {body.split("\n").map((line, index) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={`${line}-${index}`} className="pt-1 font-black text-[#312d27]">
              {line.replace("## ", "")}
            </h3>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <p key={`${line}-${index}`} className="pl-4">
              <span className="mr-2 text-[#c95d3a]">•</span>
              {line.replace("- ", "")}
            </p>
          );
        }

        if (!line.trim()) {
          return <div key={`space-${index}`} className="h-1" />;
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}

function createReviewSources(minutes: ProjectMinute[]): ReviewSource[] {
  return minutes.map((minute) => ({
    id: minute.id,
    title: minute.title,
    createdAt: minute.createdAt,
    body: minute.body,
    sourceMinuteId: minute.id,
    suggestions: toEditableSuggestions(extractMinuteSuggestions(minute.body)),
  }));
}

function getPreferredReviewSourceId(sources: ReviewSource[]) {
  return (
    sources.find((source) => getPendingSuggestionCount(source.suggestions) > 0)?.id ??
    sources[0]?.id ??
    null
  );
}

function toEditableSuggestions(
  suggestions: ExtractionSuggestion[],
): EditableSuggestion[] {
  return suggestions.map((suggestion) => ({
    ...suggestion,
    draftText: suggestion.text,
    isEditing: false,
  }));
}

function getPendingSuggestionCount(
  suggestions: Array<Pick<ExtractionSuggestion, "status">>,
) {
  return suggestions.filter((suggestion) => suggestion.status === "pending").length;
}

function getSuggestionsByType<T extends Pick<ExtractionSuggestion, "type">>(
  suggestions: T[],
) {
  return {
    decision: suggestions.filter((suggestion) => suggestion.type === "decision"),
    task: suggestions.filter((suggestion) => suggestion.type === "task"),
    ambiguity: suggestions.filter((suggestion) => suggestion.type === "ambiguity"),
  };
}

function getAcceptedReviewTasks(
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

function getSuggestionContext(
  suggestion: EditableSuggestion,
  sourceBody: string,
) {
  if (!sourceBody.trim()) {
    return "";
  }

  const lines = sourceBody.split(/\r?\n/);
  const lineIndex =
    getSuggestionLineIndex(suggestion.id, lines.length) ??
    findSuggestionLineIndex(suggestion, lines);

  if (lineIndex === null) {
    return "";
  }

  const start = Math.max(0, lineIndex - 1);
  const end = Math.min(lines.length, lineIndex + 2);

  return lines
    .slice(start, end)
    .map((line, index) => `${start + index + 1}: ${line.trim() || "(空行)"}`)
    .join("\n");
}

function getSuggestionLineIndex(suggestionId: string, lineCount: number) {
  const match = suggestionId.match(/^suggestion-(\d+)-/);
  const sourceLine = match?.[1] ? Number(match[1]) : Number.NaN;
  const lineIndex = sourceLine - 1;

  if (Number.isNaN(lineIndex) || lineIndex < 0 || lineIndex >= lineCount) {
    return null;
  }

  return lineIndex;
}

function findSuggestionLineIndex(
  suggestion: EditableSuggestion,
  lines: string[],
) {
  const searchTexts = [suggestion.text, suggestion.draftText]
    .flatMap((text) => {
      const [, ...afterColon] = text.split(/[:：]/);

      return [text, afterColon.join(":").trim()];
    })
    .map(normalizeContextSearchText)
    .filter(Boolean);

  const matchedIndex = lines.findIndex((line) => {
    const normalizedLine = normalizeContextSearchText(line);

    if (!normalizedLine) {
      return false;
    }

    return searchTexts.some(
      (searchText) =>
        normalizedLine.includes(searchText) || searchText.includes(normalizedLine),
    );
  });

  return matchedIndex >= 0 ? matchedIndex : null;
}

function normalizeContextSearchText(text: string) {
  return text
    .replace(/^(?:[-*+]|[0-9]+[.)])\s*/, "")
    .replace(/^\[[ x]\]\s*/i, "")
    .trim()
    .toLowerCase();
}

const statusToneMap = {
  pending: "slate",
  accepted: "green",
  rejected: "red",
} as const;

const statusLabelMap = {
  pending: "未レビュー",
  accepted: "採用済み",
  rejected: "却下済み",
} as const;
