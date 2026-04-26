---
name: extract-minutes-actions
description: "議事録から決定事項、TODO、曖昧点を抽出してclapboardの進捗へ反映する。Use when meeting notes, markdown minutes, review notes, or uploaded .txt and .md content must be converted into decisions, tasks, assignee candidates, due date candidates, and ambiguities."
---

# 議事録アクション抽出

## 概要

「議事録生成プロンプト集」と `lib/mock-extraction.ts` の抽出ルールを skill 化したもの。議事録をレビュー候補、タスク、曖昧点へ変換する。

## 対応見出し

- `決定事項`: decision
- `TODO`: task
- `次アクション`: task
- `未確定事項`: ambiguity
- `確認`: ambiguity
- `保留`: ambiguity
- `依存`: ambiguity
- `リスク`: ambiguity

## 手順

1. Markdown 見出し、箇条書き、インラインの `TODO:` や `期限:` を読む。
2. 決定事項、タスク、曖昧点に分ける。
3. タスクには担当者候補と期限候補を付ける。
4. 担当者または期限がないタスクには `missing-assignee` または `missing-due-date` の曖昧点を追加する。
5. 保留、依存、リスクは PM が判断できる短い文に整える。

## 出力

```markdown
## 決定事項
-

## TODO
- 内容:
  - 担当候補:
  - 期限候補:

## 曖昧点
- 種別:
  - 内容:
  - 確認先:
```

## 日付と担当者

- `期限: 2026-05-01`, `by 5/8`, `5月1日`, `今週中` などを期限候補として扱う。
- `担当: 佐藤`, `owner: Lee`, `田中さんが` などを担当候補として扱う。
- 相対日付は必要に応じて作業日の絶対日付へ補足する。
