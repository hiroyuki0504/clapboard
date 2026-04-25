import assert from "node:assert/strict";
import { test } from "node:test";
import {
  acceptSuggestions,
  createReviewSources,
  getAcceptedReviewTasks,
  getPendingSuggestionCount,
  getPreferredReviewSourceId,
  getSuggestionsByType,
  pickPendingIds,
  rejectSuggestions,
  toEditableSuggestions,
  toggleSuggestionEdit,
  updateSuggestionDraft,
} from "../lib/suggestion-state";
import type {
  EditableSuggestion,
  ProjectMinute,
  ProjectTask,
  ReviewSource,
} from "../lib/types";

function makeSuggestion(
  partial: Partial<EditableSuggestion> & Pick<EditableSuggestion, "id">,
): EditableSuggestion {
  return {
    type: "task",
    text: partial.text ?? "サンプル候補",
    draftText: partial.draftText ?? partial.text ?? "サンプル候補",
    status: "pending",
    isEditing: false,
    ...partial,
  };
}

test("toEditableSuggestions copies text into draftText and turns off editing", () => {
  const result = toEditableSuggestions([
    {
      id: "s-1",
      type: "task",
      text: " 残対応 ",
      status: "pending",
    },
  ]);

  assert.equal(result[0].draftText, " 残対応 ");
  assert.equal(result[0].isEditing, false);
  assert.equal(result[0].status, "pending");
});

test("acceptSuggestions only mutates pending suggestions in target ids with non-empty draft", () => {
  const suggestions: EditableSuggestion[] = [
    makeSuggestion({ id: "s-1", draftText: "  整理する  " }),
    makeSuggestion({ id: "s-2", status: "rejected", draftText: "却下済み" }),
    makeSuggestion({ id: "s-3", draftText: "   " }),
    makeSuggestion({ id: "s-4", draftText: "対象外なのでそのまま" }),
  ];

  const result = acceptSuggestions(
    suggestions,
    new Set(["s-1", "s-2", "s-3"]),
  );

  assert.equal(result[0].status, "accepted");
  assert.equal(result[0].text, "整理する");
  assert.equal(result[0].draftText, "整理する");
  assert.equal(result[0].isEditing, false);
  assert.equal(result[1].status, "rejected", "non-pending は変化しない");
  assert.equal(result[2].status, "pending", "空 draftText は無視");
  assert.equal(result[3], suggestions[3], "対象外は同一参照");
});

test("acceptSuggestions returns same array reference for empty target ids", () => {
  const suggestions: EditableSuggestion[] = [makeSuggestion({ id: "s-1" })];
  const result = acceptSuggestions(suggestions, new Set());

  assert.equal(result, suggestions);
});

test("rejectSuggestions only marks pending suggestions in target ids", () => {
  const suggestions: EditableSuggestion[] = [
    makeSuggestion({ id: "s-1" }),
    makeSuggestion({ id: "s-2", status: "accepted" }),
  ];

  const result = rejectSuggestions(suggestions, new Set(["s-1", "s-2"]));

  assert.equal(result[0].status, "rejected");
  assert.equal(result[0].isEditing, false);
  assert.equal(result[1].status, "accepted", "accepted は維持");
});

test("toggleSuggestionEdit only flips isEditing for pending suggestions", () => {
  const suggestions: EditableSuggestion[] = [
    makeSuggestion({ id: "s-1", isEditing: false }),
    makeSuggestion({ id: "s-2", status: "accepted", isEditing: true }),
  ];

  const afterToggleS1 = toggleSuggestionEdit(suggestions, "s-1");
  assert.equal(afterToggleS1[0].isEditing, true);

  const afterToggleS2 = toggleSuggestionEdit(suggestions, "s-2");
  assert.equal(afterToggleS2[1].isEditing, false, "pending 以外は常に false");
});

test("updateSuggestionDraft only updates draftText of matching id", () => {
  const suggestions: EditableSuggestion[] = [
    makeSuggestion({ id: "s-1", draftText: "old" }),
    makeSuggestion({ id: "s-2", draftText: "keep" }),
  ];

  const result = updateSuggestionDraft(suggestions, "s-1", "new");

  assert.equal(result[0].draftText, "new");
  assert.equal(result[1].draftText, "keep");
});

test("pickPendingIds returns the id set of pending suggestions only", () => {
  const suggestions: EditableSuggestion[] = [
    makeSuggestion({ id: "s-1" }),
    makeSuggestion({ id: "s-2", status: "accepted" }),
    makeSuggestion({ id: "s-3" }),
  ];

  assert.deepEqual([...pickPendingIds(suggestions)].sort(), ["s-1", "s-3"]);
});

test("createReviewSources sets sourceMinuteId and extracts suggestions per minute", () => {
  const minutes: ProjectMinute[] = [
    {
      id: "m-1",
      title: "キックオフ",
      createdAt: "2026-04-01T00:00:00Z",
      participants: ["alice"],
      body: "## TODO\n- 仕様確認 担当: alice 4/12",
    },
  ];

  const sources = createReviewSources(minutes);

  assert.equal(sources.length, 1);
  assert.equal(sources[0].sourceMinuteId, "m-1");
  assert.ok(
    sources[0].suggestions.length > 0,
    "TODO セクションから少なくとも 1 件抽出される",
  );
});

test("getPreferredReviewSourceId prefers the first source with pending items", () => {
  const sources: ReviewSource[] = [
    {
      id: "src-empty",
      title: "完了済み",
      createdAt: "",
      body: "",
      suggestions: [makeSuggestion({ id: "x", status: "accepted" })],
    },
    {
      id: "src-pending",
      title: "未処理あり",
      createdAt: "",
      body: "",
      suggestions: [makeSuggestion({ id: "y" })],
    },
  ];

  assert.equal(getPreferredReviewSourceId(sources), "src-pending");
  assert.equal(getPreferredReviewSourceId([]), null);
  assert.equal(
    getPreferredReviewSourceId([sources[0]]),
    "src-empty",
    "未処理がない場合は先頭",
  );
});

test("getPendingSuggestionCount and getSuggestionsByType partition suggestions", () => {
  const suggestions: EditableSuggestion[] = [
    makeSuggestion({ id: "a", type: "decision" }),
    makeSuggestion({ id: "b", type: "task", status: "accepted" }),
    makeSuggestion({ id: "c", type: "ambiguity" }),
    makeSuggestion({ id: "d", type: "task" }),
  ];

  assert.equal(getPendingSuggestionCount(suggestions), 3);
  const grouped = getSuggestionsByType(suggestions);
  assert.deepEqual(
    grouped.decision.map((s) => s.id),
    ["a"],
  );
  assert.deepEqual(
    grouped.task.map((s) => s.id),
    ["b", "d"],
  );
  assert.deepEqual(
    grouped.ambiguity.map((s) => s.id),
    ["c"],
  );
});

test("getAcceptedReviewTasks dedupes against existing tasks and ignores non-task or non-accepted", () => {
  const sources: ReviewSource[] = [
    {
      id: "src-1",
      title: "週次",
      createdAt: "",
      body: "",
      suggestions: [
        makeSuggestion({
          id: "a",
          type: "task",
          status: "accepted",
          draftText: "  仕様レビュー  ",
          dueDateCandidate: "4/30",
          assigneeCandidate: "bob",
        }),
        makeSuggestion({
          id: "b",
          type: "task",
          status: "accepted",
          draftText: "重複 候補",
        }),
        makeSuggestion({
          id: "c",
          type: "task",
          status: "pending",
          draftText: "未採用",
        }),
        makeSuggestion({
          id: "d",
          type: "decision",
          status: "accepted",
          draftText: "決定事項なのでタスク化されない",
        }),
        makeSuggestion({
          id: "e",
          type: "task",
          status: "accepted",
          draftText: "   ",
        }),
      ],
    },
  ];

  const existing: ProjectTask[] = [
    {
      id: "existing-1",
      title: "重複  候補",
      completed: false,
      priority: "medium",
      note: "空白の数違いでも normalize 後は同一",
    },
  ];

  const accepted = getAcceptedReviewTasks(sources, existing);
  assert.equal(accepted.length, 1, "重複・非task・非accepted・空文字は除外");
  assert.equal(accepted[0].title, "仕様レビュー");
  assert.equal(accepted[0].priority, "high", "due 候補があると high");
  assert.match(accepted[0].note, /担当候補: bob/);
  assert.match(accepted[0].note, /期限候補: 4\/30/);
});
