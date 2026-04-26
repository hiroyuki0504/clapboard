---
name: write-daily-brief
description: "clapboardの今日の状況をPM向けに短く整理する。Use when the user asks for a daily report, today's high priority tasks, review queue order, current blockers, or what to inspect next from projects and PR review state."
---

# 日次状況整理

## 概要

Command 画面の「今日の高優先度タスクとレビュー待ちPRをまとめて、次に見る順番を出して。」を skill 化したもの。

## 手順

1. 未完了タスク、高優先度タスク、停滞タスクを拾う。
2. レビュー待ち PR と `Crucial` / `High Priority` の未解決コメントを拾う。
3. 今日見る順番を、ブロッカー、マージ判断、通常タスクの順に並べる。
4. PM が次に開く画面や確認対象が分かるようにする。
5. 長い説明ではなく、日次確認に使える短い箇条書きにする。

## 出力

```markdown
## 今日見る順番
1.
2.
3.

## 高優先度タスク
-

## レビュー待ちPR
-

## ブロッカー
-

## 次アクション
-
```

## 文体

- PM 向けに事実と判断だけを書く。
- 「確認中」「未検証」「要追加指示」は曖昧にせず明示する。
- 日報として求められた場合は、実施内容、成果、残課題、明日の予定に整える。
