import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatSuggestionText,
  getSuggestionContext,
} from "@/lib/suggestion-context";
import type { EditableSuggestion } from "@/lib/types";

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

export function ReviewSuggestionCard({
  suggestion,
  sourceBody,
  onAccept,
  onReject,
  onToggleEdit,
  onDraftChange,
}: {
  suggestion: EditableSuggestion;
  sourceBody: string;
  onAccept: (suggestion: EditableSuggestion) => void;
  onReject: (suggestionId: string) => void;
  onToggleEdit: (suggestionId: string) => void;
  onDraftChange: (suggestionId: string, draftText: string) => void;
}) {
  const sourceContext = getSuggestionContext(suggestion, sourceBody);
  const isPending = suggestion.status === "pending";

  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tone={statusToneMap[suggestion.status]}>
          {statusLabelMap[suggestion.status]}
        </Badge>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onToggleEdit(suggestion.id)}
            disabled={!isPending}
          >
            編集
          </Button>
          <Button
            variant="secondary"
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onReject(suggestion.id)}
            disabled={!isPending}
          >
            却下
          </Button>
          <Button
            className="h-8 px-3 text-xs disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => onAccept(suggestion)}
            disabled={!isPending}
          >
            採用
          </Button>
        </div>
      </div>

      {suggestion.isEditing ? (
        <textarea
          className="mt-3 min-h-24 w-full rounded-md border border-[#d8d1c4] bg-white px-3 py-2 text-sm text-[#312d27] outline-none ring-0"
          value={suggestion.draftText}
          onChange={(event) => onDraftChange(suggestion.id, event.target.value)}
        />
      ) : (
        <p className="mt-3 text-sm leading-6 text-[#5f574d]">
          {formatSuggestionText(suggestion.draftText)}
        </p>
      )}

      {sourceContext && (
        <div className="mt-3 rounded-md border border-[#e2dacd] bg-[#fffefa] px-3 py-2">
          <p className="text-xs font-bold text-[#81786d]">元議事録の文脈</p>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-5 text-[#70675b]">
            {sourceContext}
          </pre>
        </div>
      )}

      {(suggestion.assigneeCandidate || suggestion.dueDateCandidate) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestion.assigneeCandidate && (
            <Badge tone="blue">担当候補 {suggestion.assigneeCandidate}</Badge>
          )}
          {suggestion.dueDateCandidate && (
            <Badge tone="amber">期限候補 {suggestion.dueDateCandidate}</Badge>
          )}
        </div>
      )}
    </div>
  );
}
