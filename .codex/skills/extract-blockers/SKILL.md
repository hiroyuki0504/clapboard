---
name: extract-blockers
description: "clapboardの進捗データから新着ブロッカーを抽出する。Use when the user asks to find blockers, stalled high priority tasks, missing assignees, missing due dates, unresolved decisions, risky PRs, or next actions across projects."
---

# ブロッカー抽出

## 概要

Command 画面の「新着ブロッカーを抽出」と agent log の `blocker_detect` を skill 化したもの。

## 見る対象

- `high` 優先度で未完了の task
- 期限超過または期限が近い task
- 担当者、期限、依存関係が曖昧な task
- `Crucial` / `High Priority` が未解決の PR
- 議事録の `未確定事項`, `保留`, `依存`, `リスク`

## 手順

1. プロジェクト、タスク、議事録、レビューキューを横断して候補を拾う。
2. ブロッカーを `作業停止`, `判断待ち`, `外部依存`, `検証不足`, `期限リスク` に分類する。
3. 各ブロッカーに、対象、影響、次に必要な行動、担当候補を付ける。
4. すぐ対応すべき順に並べる。

## 出力

```markdown
## ブロッカー
- [分類] タイトル
  - 対象:
  - 影響:
  - 次アクション:
  - 担当候補:

## 今日の優先順
1.
2.
3.
```

ブロッカーがない場合は、確認範囲と通常の次アクションだけを返す。
