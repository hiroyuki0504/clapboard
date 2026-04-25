import type { EditableSuggestion } from "@/lib/types";

export function getSuggestionContext(
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

export function formatSuggestionText(text: string) {
  return text
    .replace(/^missing-assignee:\s*/, "担当未設定: ")
    .replace(/^missing-due-date:\s*/, "期限未設定: ")
    .replace(/^unresolved-decision:\s*/, "未確定判断: ")
    .replace(/^unclear-dependency:\s*/, "依存関係: ")
    .replace(/^risk:\s*/, "リスク確認: ");
}
