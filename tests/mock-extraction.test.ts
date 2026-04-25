import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { extractMinuteSuggestions } from "../lib/mock-extraction";

describe("extractMinuteSuggestions", () => {
  it("extracts decisions, tasks, due dates, and explicit assignees from heading sections", () => {
    const suggestions = extractMinuteSuggestions(`
## 決定事項
- トップページはサービス訴求を優先

## TODO
- 担当: 佐藤 2026/05/01までにCTA文言を確定

## 未確定事項
- ロゴ利用可否は先方確認待ち
`);

    assert.deepEqual(suggestions, [
      {
        id: "suggestion-3-0-decision",
        type: "decision",
        text: "トップページはサービス訴求を優先",
        assigneeCandidate: undefined,
        dueDateCandidate: undefined,
        status: "pending",
      },
      {
        id: "suggestion-6-0-task",
        type: "task",
        text: "担当: 佐藤 2026/05/01までにCTA文言を確定",
        assigneeCandidate: "佐藤",
        dueDateCandidate: "2026/05/01",
        status: "pending",
      },
      {
        id: "suggestion-9-0-ambiguity",
        type: "ambiguity",
        text: "unresolved-decision: ロゴ利用可否は先方確認待ち",
        assigneeCandidate: undefined,
        dueDateCandidate: undefined,
        status: "pending",
      },
    ]);
  });

  it("extracts inline tagged tasks with Japanese assignees and short dates", () => {
    const suggestions = extractMinuteSuggestions(`
TODO: 田中さんが 4/30までにQA観点を整理
確認: API認証方式を決める
依存: 外部APIのSandbox待ち
`);

    assert.deepEqual(suggestions, [
      {
        id: "suggestion-2-0-task",
        type: "task",
        text: "田中さんが 4/30までにQA観点を整理",
        assigneeCandidate: "田中さん",
        dueDateCandidate: "4/30",
        status: "pending",
      },
      {
        id: "suggestion-3-0-ambiguity",
        type: "ambiguity",
        text: "unresolved-decision: API認証方式を決める",
        assigneeCandidate: undefined,
        dueDateCandidate: undefined,
        status: "pending",
      },
      {
        id: "suggestion-4-0-ambiguity",
        type: "ambiguity",
        text: "unclear-dependency: 外部APIのSandbox待ち",
        assigneeCandidate: undefined,
        dueDateCandidate: undefined,
        status: "pending",
      },
    ]);
  });

  it("adds missing-field ambiguities for tasks without assignee or due date", () => {
    const suggestions = extractMinuteSuggestions(`
## TODO
- 導入事例の掲載可否を確認
`);

    assert.deepEqual(suggestions, [
      {
        id: "suggestion-3-0-task",
        type: "task",
        text: "導入事例の掲載可否を確認",
        assigneeCandidate: undefined,
        dueDateCandidate: undefined,
        status: "pending",
      },
      {
        id: "suggestion-3-1-ambiguity",
        type: "ambiguity",
        text: "missing-assignee: 導入事例の掲載可否を確認",
        status: "pending",
      },
      {
        id: "suggestion-3-2-ambiguity",
        type: "ambiguity",
        text: "missing-due-date: 導入事例の掲載可否を確認",
        status: "pending",
      },
    ]);
  });

  it("does not carry a known section through an unsupported markdown heading", () => {
    const suggestions = extractMinuteSuggestions(`
## TODO
- 担当: 山田 来週中に確認観点をまとめる

## メモ
- この行はタスク候補にしない

TODO: 佐藤さんが 5月1日までに議事録を共有
`);

    assert.deepEqual(suggestions, [
      {
        id: "suggestion-3-0-task",
        type: "task",
        text: "担当: 山田 来週中に確認観点をまとめる",
        assigneeCandidate: "山田",
        dueDateCandidate: "来週中",
        status: "pending",
      },
      {
        id: "suggestion-8-0-task",
        type: "task",
        text: "佐藤さんが 5月1日までに議事録を共有",
        assigneeCandidate: "佐藤さん",
        dueDateCandidate: "5月1日",
        status: "pending",
      },
    ]);
  });
});
