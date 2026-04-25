"use client";

import {
  ArrowUpRight,
  CalendarClock,
  FileText,
  FolderOpen,
  Landmark,
  ListChecks,
  Upload,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { extractMinuteSuggestions } from "@/lib/mock-extraction";
import {
  mergeProjectWithSnapshot,
  readProjectSnapshot,
  writeProjectSnapshot,
} from "@/lib/project-persistence";
import type {
  ExtractionSuggestion,
  MinuteImport,
  Project,
  ProjectAmbiguity,
  ProjectAmbiguityKind,
  ProjectDecision,
  ProjectMinute,
  ProjectTask,
} from "@/lib/types";
import { cn, formatCurrency, formatDate, formatDateTime } from "@/lib/utils";

type TabKey = "overview" | "review" | "minutes" | "finance" | "files";

type EditableSuggestion = ExtractionSuggestion & {
  draftText: string;
  isEditing: boolean;
};

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "review", label: "Review", icon: ListChecks },
  { key: "minutes", label: "Minutes", icon: UsersRound },
  { key: "finance", label: "Finance", icon: Landmark },
  { key: "files", label: "Files", icon: FolderOpen },
];

export function ProjectDetailTabs({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [projectState, setProjectState] = useState(() => createProjectState(project));
  const [reviewError, setReviewError] = useState("");
  const [selectedImportId, setSelectedImportId] = useState<string | null>(() =>
    getPreferredReviewImportId(project.imports),
  );
  const [suggestions, setSuggestions] = useState<EditableSuggestion[]>(
    getEditableSuggestions(getImportById(project, getPreferredReviewImportId(project.imports))),
  );
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);

  useEffect(() => {
    const hydratedProject = mergeProjectWithSnapshot(
      project,
      readProjectSnapshot(project.id),
    );

    setProjectState(createProjectState(hydratedProject));
    const nextSelectedImportId = getPreferredReviewImportId(hydratedProject.imports);
    setSelectedImportId(nextSelectedImportId);
    setSuggestions(
      getEditableSuggestions(getImportById(hydratedProject, nextSelectedImportId)),
    );
    setIsPersistenceReady(true);
  }, [project]);

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    writeProjectSnapshot(project.id, projectState);
  }, [isPersistenceReady, project.id, projectState]);

  const tasks = projectState.tasks;
  const decisions = projectState.decisions;
  const ambiguities = projectState.ambiguities;
  const minutes = projectState.minutes;
  const imports = getSortedImports(projectState.imports);
  const selectedImport =
    getImportById(projectState, selectedImportId) ?? getLatestImport(projectState);
  const sourceBody = getImportSourceBody(projectState, selectedImport);
  const sourceFilename = selectedImport?.filename ?? "";

  const profit = project.revenue - project.cost;
  const completion = useMemo(() => {
    const completed = tasks.filter((task) => task.completed).length;

    if (tasks.length === 0) {
      return 0;
    }

    return Math.round((completed / tasks.length) * 100);
  }, [tasks]);
  const unresolvedAmbiguities = ambiguities.filter((ambiguity) => !ambiguity.resolved);
  const latestDecisions = [...decisions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);
  const suggestionsByType = {
    decision: suggestions.filter((suggestion) => suggestion.type === "decision"),
    task: suggestions.filter((suggestion) => suggestion.type === "task"),
    ambiguity: suggestions.filter((suggestion) => suggestion.type === "ambiguity"),
  };

  async function handleImportChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const filename = file.name;
    const extension = filename.split(".").pop()?.toLowerCase();

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

    setReviewError("");
    const createdAt = new Date().toISOString();
    const sourceMinuteId = `minute-${Date.now()}`;
    const nextSuggestions = extractMinuteSuggestions(text);
    const nextMinute: ProjectMinute = {
      id: sourceMinuteId,
      title: filename,
      createdAt,
      participants: ["ローカル取り込み"],
      body: text,
    };
    const nextImport: MinuteImport = {
      id: `import-${Date.now()}`,
      filename,
      createdAt,
      body: text,
      extractionStatus: getImportExtractionStatus(nextSuggestions),
      sourceMinuteId,
      suggestions: nextSuggestions,
    };

    setProjectState((current) => ({
      ...current,
      lastUpdated: createdAt,
      minutes: [nextMinute, ...current.minutes],
      imports: [nextImport, ...current.imports],
    }));
    setSelectedImportId(nextImport.id);
    setSuggestions(toEditableSuggestions(nextSuggestions));
    setActiveTab("review");
    event.target.value = "";
  }

  function updateSuggestion(
    suggestionId: string,
    updater: (suggestion: EditableSuggestion) => EditableSuggestion,
    updatedAt?: string,
  ) {
    setSuggestions((current) => {
      const nextSuggestions = current.map((suggestion) =>
        suggestion.id === suggestionId ? updater(suggestion) : suggestion,
      );

      syncImportSuggestions(selectedImportId, nextSuggestions, updatedAt);

      return nextSuggestions;
    });
  }

  function handleAcceptSuggestion(suggestion: EditableSuggestion) {
    if (suggestion.status !== "pending") {
      return;
    }

    const normalizedText = suggestion.draftText.trim();

    if (!normalizedText) {
      return;
    }

    const updatedAt = new Date().toISOString();
    const sourceMinuteId =
      selectedImport?.sourceMinuteId ?? getLatestSourceMinuteId(minutes);

    if (suggestion.type === "decision") {
      const decision: ProjectDecision = {
        id: `decision-${Date.now()}-${suggestion.id}`,
        date: updatedAt,
        summary: normalizedText,
        sourceMinuteId,
      };

      setProjectState((current) => ({
        ...current,
        lastUpdated: updatedAt,
        decisions: current.decisions.some(
          (currentDecision) => currentDecision.summary === normalizedText,
        )
          ? current.decisions
          : [decision, ...current.decisions],
      }));
    }

    if (suggestion.type === "task") {
      const task: ProjectTask = {
        id: `task-${Date.now()}-${suggestion.id}`,
        title: normalizedText,
        completed: false,
        priority: suggestion.dueDateCandidate ? "high" : "medium",
        note: buildTaskNote(suggestion),
      };

      setProjectState((current) => ({
        ...current,
        lastUpdated: updatedAt,
        tasks: current.tasks.some((currentTask) => currentTask.title === normalizedText)
          ? current.tasks
          : [task, ...current.tasks],
      }));
    }

    if (suggestion.type === "ambiguity") {
      const parsed = parseAmbiguityText(normalizedText);
      const ambiguity: ProjectAmbiguity = {
        id: `ambiguity-${Date.now()}-${suggestion.id}`,
        kind: parsed.kind,
        summary: parsed.summary,
        resolved: false,
        sourceMinuteId,
      };

      setProjectState((current) => ({
        ...current,
        lastUpdated: updatedAt,
        ambiguities: current.ambiguities.some(
          (currentAmbiguity) =>
            currentAmbiguity.kind === ambiguity.kind &&
            currentAmbiguity.summary === ambiguity.summary,
        )
          ? current.ambiguities
          : [ambiguity, ...current.ambiguities],
      }));
    }

    updateSuggestion(suggestion.id, (current) => ({
      ...current,
      status: "accepted",
      text: normalizedText,
      draftText: normalizedText,
      isEditing: false,
    }), updatedAt);
  }

  function handleRejectSuggestion(suggestionId: string) {
    const updatedAt = new Date().toISOString();

    updateSuggestion(suggestionId, (current) => ({
      ...current,
      status: "rejected",
      isEditing: false,
    }), updatedAt);
  }

  function toggleSuggestionEdit(suggestionId: string) {
    updateSuggestion(suggestionId, (current) => ({
      ...current,
      isEditing: current.status === "pending" ? !current.isEditing : false,
    }));
  }

  function syncImportSuggestions(
    importId: string | null,
    nextSuggestions: EditableSuggestion[],
    updatedAt?: string,
  ) {
    if (!importId) {
      return;
    }

    setProjectState((current) => {
      const currentImport = getImportById(current, importId);

      if (!currentImport) {
        return current;
      }

      return {
        ...current,
        lastUpdated: updatedAt ?? current.lastUpdated,
        imports: current.imports.map((entry) =>
          entry.id === currentImport.id
            ? {
                ...entry,
                suggestions: nextSuggestions.map(stripEditableSuggestion),
                extractionStatus: getImportExtractionStatus(nextSuggestions),
              }
            : entry,
        ),
      };
    });
  }

  function toggleAmbiguityResolved(ambiguityId: string) {
    const updatedAt = new Date().toISOString();

    setProjectState((current) => ({
      ...current,
      lastUpdated: updatedAt,
      ambiguities: current.ambiguities.map((ambiguity) =>
        ambiguity.id === ambiguityId
          ? { ...ambiguity, resolved: !ambiguity.resolved }
          : ambiguity,
      ),
    }));
  }

  function updateSuggestionDraft(suggestionId: string, draftText: string) {
    updateSuggestion(suggestionId, (current) => ({
      ...current,
      draftText,
    }));
  }

  function handleSelectImport(importId: string) {
    setSelectedImportId(importId);
    setSuggestions(getEditableSuggestions(getImportById(projectState, importId)));
    setReviewError("");
  }

  function markImportReviewed(importId: string) {
    const updatedAt = new Date().toISOString();

    setProjectState((current) => ({
      ...current,
      lastUpdated: updatedAt,
      imports: current.imports.map((entry) =>
        entry.id === importId
          ? {
              ...entry,
              suggestions: entry.suggestions ?? [],
              extractionStatus: "reviewed",
            }
          : entry,
      ),
    }));

    if (selectedImportId === importId) {
      setSuggestions(getEditableSuggestions(getImportById(projectState, importId)));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[#423c33]/55 bg-[#f3f0e7] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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

      {activeTab === "overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>案件概要</CardTitle>
                <p className="mt-1 text-sm text-[#81786d]">
                  ステータス、進捗、期限、担当者を確認します。
                </p>
              </div>
              <ProjectStatusBadge status={project.status} />
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-[#5f574d]">{project.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={CalendarClock}
                  label="期限"
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
              <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#312d27]">
                    タスク進行
                  </span>
                  <span className="font-mono text-sm font-bold text-[#312d27]">
                    {completion}%
                  </span>
                </div>
                <p className="text-sm text-[#70675b]">
                  未完了 {tasks.filter((task) => !task.completed).length}件
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>最新の決定事項</CardTitle>
                <span className="text-xs text-[#81786d]">decisions</span>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestDecisions.map((decision) => (
                  <div
                    key={decision.id}
                    className="border-l-2 border-[#cf623d] bg-[#f8efe8] px-4 py-3"
                  >
                    <p className="font-mono text-xs font-bold text-[#9a4a31]">
                      {formatDateTime(decision.date)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5f574d]">
                      {decision.summary}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>未解消の未確定事項</CardTitle>
                <Badge tone="red">{unresolvedAmbiguities.length}</Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {unresolvedAmbiguities.length === 0 && (
                  <p className="text-sm text-[#81786d]">
                    未解消の項目はありません。
                  </p>
                )}
                {unresolvedAmbiguities.map((ambiguity) => (
                  <div
                    key={ambiguity.id}
                    className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge tone="amber">{ambiguityLabelMap[ambiguity.kind]}</Badge>
                      <Button
                        variant="secondary"
                        className="h-8 px-3 text-xs"
                        onClick={() => toggleAmbiguityResolved(ambiguity.id)}
                      >
                        解消済みにする
                      </Button>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[#5f574d]">
                      {ambiguity.summary}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "review" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>議事録レビュー</CardTitle>
                <p className="mt-1 text-sm text-[#81786d]">
                  議事録ファイルを読み込み、抽出結果を確認して案件へ反映します。
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
              <p className="text-xs font-mono text-[#81786d]">
                {sourceFilename ? `現在のソース: ${sourceFilename}` : "未取り込み"}
              </p>
              {reviewError && (
                <div className="rounded-md border border-[#e2ac98] bg-[#f8d8cb] px-4 py-3 text-sm text-[#9f452c]">
                  {reviewError}
                </div>
              )}
              {imports.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                    レビュー対象
                  </p>
                  <div className="space-y-2">
                    {imports.map((entry) => {
                      const isActive = entry.id === selectedImport?.id;
                      const pendingCount = getPendingImportSuggestionCount(entry);

                      return (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => handleSelectImport(entry.id)}
                          className={cn(
                            "flex w-full items-start justify-between gap-3 rounded-md border px-3 py-3 text-left transition",
                            isActive
                              ? "border-[#c95d3a] bg-[#fff4ef]"
                              : "border-[#d8d1c4] bg-[#fbfaf5] hover:border-[#b9b0a3]",
                          )}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-[#312d27]">
                              {entry.filename}
                            </p>
                            <p className="mt-1 text-xs text-[#81786d]">
                              {formatDateTime(entry.createdAt)}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <Badge tone={entry.extractionStatus === "reviewed" ? "green" : "amber"}>
                              {entry.extractionStatus === "reviewed"
                                ? "レビュー済み"
                                : pendingCount > 0
                                  ? `${pendingCount}件待ち`
                                  : "確認待ち"}
                            </Badge>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {selectedImport &&
                suggestions.length === 0 &&
                selectedImport.extractionStatus !== "reviewed" && (
                  <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
                    <p className="text-sm text-[#5f574d]">
                      抽出候補がありませんでした。内容確認後、この取り込みをレビュー済みにできます。
                    </p>
                    <Button
                      className="mt-3 h-8 px-3 text-xs"
                      onClick={() => markImportReviewed(selectedImport.id)}
                    >
                      この取り込みをレビュー済みにする
                    </Button>
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
                {sourceBody ? (
                  <MarkdownLike body={sourceBody} />
                ) : (
                  <EmptyPanel text="議事録ファイルを取り込むと本文をここに表示します。" />
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <SuggestionSection
                title="決定事項"
                suggestions={suggestionsByType.decision}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onToggleEdit={toggleSuggestionEdit}
                onDraftChange={updateSuggestionDraft}
              />
              <SuggestionSection
                title="ToDo"
                suggestions={suggestionsByType.task}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onToggleEdit={toggleSuggestionEdit}
                onDraftChange={updateSuggestionDraft}
              />
              <SuggestionSection
                title="未確定事項"
                suggestions={suggestionsByType.ambiguity}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onToggleEdit={toggleSuggestionEdit}
                onDraftChange={updateSuggestionDraft}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "minutes" && (
        <div className="space-y-4" id="minutes">
          {minutes.map((minute) => (
            <Card key={minute.id}>
              <CardHeader>
                <div>
                  <CardTitle>{minute.title}</CardTitle>
                  <p className="mt-1 text-sm text-[#81786d]">
                    {formatDateTime(minute.createdAt)} ・ 参加者{" "}
                    {minute.participants.join(" / ")}
                  </p>
                </div>
                <Badge tone="blue">履歴</Badge>
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
            <FinanceTile label="売上" value={formatCurrency(project.revenue)} tone="blue" />
            <FinanceTile label="支出" value={formatCurrency(project.cost)} tone="amber" />
            <FinanceTile label="利益" value={formatCurrency(profit)} tone="green" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>取引履歴</CardTitle>
              <Button variant="secondary">取引追加</Button>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[620px]">
                <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                  <tr>
                    <th className="px-5 py-4">日付</th>
                    <th className="px-5 py-4">内容</th>
                    <th className="px-5 py-4">種別</th>
                    <th className="px-5 py-4 text-right">金額</th>
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
                        <Badge tone={transaction.type === "revenue" ? "green" : "amber"}>
                          {transaction.type === "revenue" ? "売上" : "支出"}
                        </Badge>
                      </td>
                      <td className="border-t border-[#ded6ca] px-5 py-4 text-right font-bold text-[#312d27]">
                        {formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                MVPでは外部URLの表示と整理に絞っています。
              </p>
            </div>
            <Button variant="secondary">URL追加</Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {project.files.map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="group rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4 transition hover:border-[#c95d3a]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone="blue">{file.type.toUpperCase()}</Badge>
                    <p className="mt-3 font-bold text-[#312d27]">{file.name}</p>
                    <p className="mt-1 text-sm text-[#70675b]">
                      更新日 {formatDateTime(file.updatedAt)}
                    </p>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[#9a9084] transition group-hover:text-[#c95d3a]" />
                </div>
              </a>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SuggestionSection({
  title,
  suggestions,
  onAccept,
  onReject,
  onToggleEdit,
  onDraftChange,
}: {
  title: string;
  suggestions: EditableSuggestion[];
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
          <EmptyPanel text={`${title} の候補はまだありません。`} />
        )}
        {suggestions.map((suggestion) => (
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
                  className="h-8 px-3 text-xs"
                  onClick={() => onToggleEdit(suggestion.id)}
                  disabled={suggestion.status !== "pending"}
                >
                  編集
                </Button>
                <Button
                  variant="secondary"
                  className="h-8 px-3 text-xs"
                  onClick={() => onReject(suggestion.id)}
                  disabled={suggestion.status !== "pending"}
                >
                  却下
                </Button>
                <Button
                  className="h-8 px-3 text-xs"
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
        ))}
      </CardContent>
    </Card>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-[#d8d1c4] bg-[#fbfaf5] px-4 py-6 text-sm text-[#81786d]">
      {text}
    </div>
  );
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
  tone: "blue" | "amber" | "green";
}) {
  const toneClass = {
    blue: "bg-[#eef4f8] border-[#a8bed4]",
    amber: "bg-[#fff3c8] border-[#d4bd7f]",
    green: "bg-[#edf5ea] border-[#a8c3a6]",
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

function toEditableSuggestions(
  suggestions: ExtractionSuggestion[],
): EditableSuggestion[] {
  return suggestions.map((suggestion) => ({
    ...suggestion,
    draftText: suggestion.text,
    isEditing: false,
  }));
}

function getEditableSuggestions(entry?: MinuteImport) {
  return toEditableSuggestions(getImportSuggestions(entry));
}

function getImportSuggestions(entry?: MinuteImport) {
  if (!entry) {
    return [];
  }

  return entry.suggestions ?? extractMinuteSuggestions(entry.body);
}

function stripEditableSuggestion(
  suggestion: EditableSuggestion,
): ExtractionSuggestion {
  return {
    id: suggestion.id,
    type: suggestion.type,
    text: suggestion.draftText,
    assigneeCandidate: suggestion.assigneeCandidate,
    dueDateCandidate: suggestion.dueDateCandidate,
    status: suggestion.status,
  };
}

function parseAmbiguityText(text: string): {
  kind: ProjectAmbiguityKind;
  summary: string;
} {
  const [rawKind, ...rest] = text.split(":");
  const summary = rest.join(":").trim();

  if (rawKind in ambiguityLabelMap) {
    return {
      kind: rawKind as ProjectAmbiguityKind,
      summary: summary || text,
    };
  }

  return {
    kind: "unresolved-decision",
    summary: text,
  };
}

function getLatestImport(project: Pick<Project, "imports">) {
  return getSortedImports(project.imports)[0];
}

function getImportById(
  project: Pick<Project, "imports">,
  importId: string | null,
) {
  if (!importId) {
    return undefined;
  }

  return project.imports.find((entry) => entry.id === importId);
}

function getSortedImports(imports: MinuteImport[]) {
  return [...imports].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function getPendingImportSuggestionCount(entry: MinuteImport) {
  return (entry.suggestions ?? []).filter(
    (suggestion) => suggestion.status === "pending",
  ).length;
}

function getPreferredReviewImportId(imports: MinuteImport[]) {
  const pendingImport = getSortedImports(imports).find(
    (entry) =>
      entry.extractionStatus !== "reviewed" ||
      getPendingImportSuggestionCount(entry) > 0,
  );

  return pendingImport?.id ?? getSortedImports(imports)[0]?.id ?? null;
}

function getImportSourceBody(
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

function getLatestSourceMinuteId(minutes: ProjectMinute[]) {
  return [...minutes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]?.id ?? "manual-import";
}

function createProjectState(project: Project) {
  return {
    lastUpdated: project.lastUpdated,
    tasks: project.tasks,
    decisions: project.decisions,
    ambiguities: project.ambiguities,
    minutes: project.minutes,
    imports: project.imports,
  };
}

function getImportExtractionStatus(
  suggestions: Array<Pick<ExtractionSuggestion, "status">>,
): MinuteImport["extractionStatus"] {
  if (suggestions.length === 0) {
    return "pending";
  }

  return suggestions.some((suggestion) => suggestion.status === "pending")
    ? "extracted"
    : "reviewed";
}

function buildTaskNote(suggestion: EditableSuggestion) {
  const parts = ["議事録レビューから追加"];

  if (suggestion.assigneeCandidate) {
    parts.push(`担当候補: ${suggestion.assigneeCandidate}`);
  }

  if (suggestion.dueDateCandidate) {
    parts.push(`期限候補: ${suggestion.dueDateCandidate}`);
  }

  return parts.join(" / ");
}

const ambiguityLabelMap: Record<ProjectAmbiguityKind, string> = {
  "missing-assignee": "担当者なし",
  "missing-due-date": "期限なし",
  "unresolved-decision": "決定未確定",
  "unclear-dependency": "依存不明",
};

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
