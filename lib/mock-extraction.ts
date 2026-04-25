import type {
  ExtractionSuggestion,
  ProjectAmbiguityKind,
} from "@/lib/types";

type SuggestionSection = ExtractionSuggestion["type"] | null;

const HEADING_TYPE_MAP: Record<
  string,
  { type: ExtractionSuggestion["type"]; ambiguityKind?: ProjectAmbiguityKind }
> = {
  "決定事項": { type: "decision" },
  TODO: { type: "task" },
  "次アクション": { type: "task" },
  "未確定事項": { type: "ambiguity", ambiguityKind: "unresolved-decision" },
  "確認": { type: "ambiguity", ambiguityKind: "unresolved-decision" },
  "保留": { type: "ambiguity", ambiguityKind: "unresolved-decision" },
  "依存": { type: "ambiguity", ambiguityKind: "unclear-dependency" },
};

const HEADING_PREFIX_PATTERN = String.raw`(?:(?:[#>*-]+|\d+[.)])\s*)?`;

const DATE_PATTERNS = [
  /\b\d{4}[/-]\d{1,2}[/-]\d{1,2}\b/,
  /\b\d{1,2}[/-]\d{1,2}\b/,
  /\d{1,2}月\d{1,2}日/,
  /(今週中|来週中|今月中|月曜まで|火曜まで|水曜まで|木曜まで|金曜まで)/,
];

const ASSIGNEE_PATTERNS = [
  /(?:担当|owner|assignee)[:：]\s*([^\s,、。]+)/i,
  /([^\s,、。]+(?:さん|氏))(?:が|は)/,
];

export function extractMinuteSuggestions(text: string): ExtractionSuggestion[] {
  const lines = text.split(/\r?\n/);
  const suggestions: ExtractionSuggestion[] = [];
  let currentSection: SuggestionSection = null;

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    if (!line) {
      return;
    }

    const headingMatch = matchHeading(line);

    if (headingMatch) {
      currentSection = headingMatch.type;

      if (headingMatch.content) {
        suggestions.push(
          ...buildSuggestions(
            headingMatch.type,
            headingMatch.content,
            index,
            headingMatch.ambiguityKind,
          ),
        );
      }

      return;
    }

    if (isUnsupportedMarkdownHeading(line)) {
      currentSection = null;
      return;
    }

    const itemText = normalizeItemText(line);

    if (!itemText) {
      return;
    }

    if (currentSection) {
      suggestions.push(
        ...buildSuggestions(
          currentSection,
          itemText,
          index,
          inferAmbiguityKind(itemText, currentSection),
        ),
      );
      return;
    }

    const inlineMatch = matchInlineTaggedLine(itemText);

    if (inlineMatch) {
      suggestions.push(
        ...buildSuggestions(
          inlineMatch.type,
          inlineMatch.content,
          index,
          inlineMatch.ambiguityKind,
        ),
      );
    }
  });

  return suggestions;
}

function buildSuggestions(
  type: ExtractionSuggestion["type"],
  text: string,
  lineIndex: number,
  ambiguityKind?: ProjectAmbiguityKind,
): ExtractionSuggestion[] {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  const assigneeCandidate = extractAssigneeCandidate(normalizedText);
  const dueDateCandidate = extractDueDateCandidate(normalizedText);
  const baseSuggestion: ExtractionSuggestion = {
    id: createSuggestionId(type, lineIndex, 0),
    type,
    text:
      type === "ambiguity"
        ? formatAmbiguityText(
            ambiguityKind ?? inferAmbiguityKind(normalizedText, type),
            normalizedText,
          )
        : normalizedText,
    assigneeCandidate,
    dueDateCandidate,
    status: "pending",
  };

  if (type !== "task") {
    return [baseSuggestion];
  }

  const taskSuggestions: ExtractionSuggestion[] = [baseSuggestion];

  if (!assigneeCandidate) {
    taskSuggestions.push({
      id: createSuggestionId("ambiguity", lineIndex, 1),
      type: "ambiguity",
      text: `missing-assignee: ${normalizedText}`,
      status: "pending",
    });
  }

  if (!dueDateCandidate) {
    taskSuggestions.push({
      id: createSuggestionId("ambiguity", lineIndex, 2),
      type: "ambiguity",
      text: `missing-due-date: ${normalizedText}`,
      status: "pending",
    });
  }

  return taskSuggestions;
}

function matchHeading(
  line: string,
): {
  type: ExtractionSuggestion["type"];
  content: string;
  ambiguityKind?: ProjectAmbiguityKind;
} | null {
  const matchedHeading = Object.keys(HEADING_TYPE_MAP).find((heading) =>
    new RegExp(
      `^${HEADING_PREFIX_PATTERN}${escapeForRegExp(
        heading,
      )}\\s*(?:[:：-]\\s*(.*))?$`,
      "i",
    ).test(line),
  );

  if (!matchedHeading) {
    return null;
  }

  const contentMatch = line.match(
    new RegExp(
      `^${HEADING_PREFIX_PATTERN}${escapeForRegExp(matchedHeading)}\\s*(?:[:：-]\\s*(.*))?$`,
      "i",
    ),
  );

  return {
    type: HEADING_TYPE_MAP[matchedHeading].type,
    content: contentMatch?.[1]?.trim() ?? "",
    ambiguityKind: HEADING_TYPE_MAP[matchedHeading].ambiguityKind,
  };
}

function normalizeItemText(line: string): string {
  return line
    .replace(/^(?:[-*+]|[0-9]+[.)])\s*/, "")
    .replace(/^\[[ x]\]\s*/i, "")
    .trim();
}

function matchInlineTaggedLine(
  line: string,
): {
  type: ExtractionSuggestion["type"];
  content: string;
  ambiguityKind?: ProjectAmbiguityKind;
} | null {
  for (const [label, config] of Object.entries(HEADING_TYPE_MAP)) {
    const match = line.match(
      new RegExp(
        `^${escapeForRegExp(label)}(?:[:：-]|\\s)+(.*)$`,
        "i",
      ),
    );

    if (match?.[1]) {
      return {
        type: config.type,
        content: match[1].trim(),
        ambiguityKind: config.ambiguityKind,
      };
    }
  }

  return null;
}

function isUnsupportedMarkdownHeading(line: string) {
  return /^#{1,6}\s+\S/.test(line);
}

function extractAssigneeCandidate(text: string): string | undefined {
  for (const pattern of ASSIGNEE_PATTERNS) {
    const match = text.match(pattern);

    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

function extractDueDateCandidate(text: string): string | undefined {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);

    if (match?.[0]) {
      return match[0].trim();
    }
  }

  return undefined;
}

function createSuggestionId(
  type: ExtractionSuggestion["type"],
  lineIndex: number,
  offset: number,
): string {
  return `suggestion-${lineIndex + 1}-${offset}-${type}`;
}

function inferAmbiguityKind(
  text: string,
  type: ExtractionSuggestion["type"],
): ProjectAmbiguityKind {
  if (type !== "ambiguity") {
    return "unresolved-decision";
  }

  if (/(依存|待ち|blocker|blocked|先方確認)/i.test(text)) {
    return "unclear-dependency";
  }

  return "unresolved-decision";
}

function formatAmbiguityText(
  kind: ProjectAmbiguityKind,
  text: string,
): string {
  return `${kind}: ${text}`;
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
