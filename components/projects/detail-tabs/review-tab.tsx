import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingSuggestionCount } from "@/lib/suggestion-state";
import type { EditableSuggestion, ReviewSource } from "@/lib/types";
import { cn, formatDateTime } from "@/lib/utils";
import { EmptyState, MarkdownLike } from "./_shared";

export type ReviewFilter = "all" | EditableSuggestion["status"];

export const reviewFilterOptions: { key: ReviewFilter; label: string }[] = [
  { key: "pending", label: "未処理" },
  { key: "all", label: "すべて" },
  { key: "accepted", label: "採用済み" },
  { key: "rejected", label: "却下済み" },
];

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

export function ReviewTab({
  reviewSources,
  selectedReviewSource,
  reviewError,
  reviewFilter,
  suggestionStats,
  suggestionsByType,
  visiblePendingCount,
  onImportChange,
  onSelectReviewSource,
  onFilterChange,
  onAcceptVisible,
  onRejectVisible,
  onAcceptSuggestion,
  onRejectSuggestion,
  onToggleEdit,
  onDraftChange,
}: {
  reviewSources: ReviewSource[];
  selectedReviewSource: ReviewSource | undefined;
  reviewError: string;
  reviewFilter: ReviewFilter;
  suggestionStats: Record<ReviewFilter, number>;
  suggestionsByType: {
    decision: EditableSuggestion[];
    task: EditableSuggestion[];
    ambiguity: EditableSuggestion[];
  };
  visiblePendingCount: number;
  onImportChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectReviewSource: (sourceId: string) => void;
  onFilterChange: (filter: ReviewFilter) => void;
  onAcceptVisible: () => void;
  onRejectVisible: () => void;
  onAcceptSuggestion: (suggestion: EditableSuggestion) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onToggleEdit: (suggestionId: string) => void;
  onDraftChange: (suggestionId: string, draftText: string) => void;
}) {
  const sourceBody = selectedReviewSource?.body ?? "";

  return (
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
              onChange={onImportChange}
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
                      onClick={() => onSelectReviewSource(source.id)}
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
                        {pendingCount > 0 ? `${pendingCount}件待ち` : "レビュー済み"}
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
            visiblePendingCount={visiblePendingCount}
            onFilterChange={onFilterChange}
            onAcceptVisible={onAcceptVisible}
            onRejectVisible={onRejectVisible}
          />
          <SuggestionSection
            title="決定事項"
            suggestions={suggestionsByType.decision}
            sourceBody={sourceBody}
            onAccept={onAcceptSuggestion}
            onReject={onRejectSuggestion}
            onToggleEdit={onToggleEdit}
            onDraftChange={onDraftChange}
          />
          <SuggestionSection
            title="ToDo"
            suggestions={suggestionsByType.task}
            sourceBody={sourceBody}
            onAccept={onAcceptSuggestion}
            onReject={onRejectSuggestion}
            onToggleEdit={onToggleEdit}
            onDraftChange={onDraftChange}
          />
          <SuggestionSection
            title="未確定事項"
            suggestions={suggestionsByType.ambiguity}
            sourceBody={sourceBody}
            onAccept={onAcceptSuggestion}
            onReject={onRejectSuggestion}
            onToggleEdit={onToggleEdit}
            onDraftChange={onDraftChange}
          />
        </div>
      </div>
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
                  {formatSuggestionText(suggestion.draftText)}
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

function formatSuggestionText(text: string) {
  return text
    .replace(/^missing-assignee:\s*/, "担当未設定: ")
    .replace(/^missing-due-date:\s*/, "期限未設定: ")
    .replace(/^unresolved-decision:\s*/, "未確定判断: ")
    .replace(/^unclear-dependency:\s*/, "依存関係: ")
    .replace(/^risk:\s*/, "リスク確認: ");
}
