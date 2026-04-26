---
name: prepare-web-worktree
description: "ClawBoardの自然言語開発依頼をWebワークツリー化する。Use when a browser request, natural language task, or no-code development request must be scoped into one branch, one preview, one PR candidate, acceptance criteria, checks, and PM next actions."
---

# Webワークツリー化

## 概要

「ターミナルなしで依頼を受け、必要な差分と検証結果をWebに返す」を、ClawBoard の作業単位に変換する。

## 原則

- 1依頼 = 1 Webワークツリー = 1ブランチ = 1PR に閉じる。
- `main` へ直接反映しない。
- PM がブラウザで状態、プレビュー、差分、残リスクを理解できる形にする。
- UI変更、API変更、認証変更などレビュー観点が大きく違うものは分ける。

## 手順

1. 依頼文から目的、利用者、期待成果を1つに絞る。
2. 変更範囲を route、component、lib、API、docs に分ける。
3. ブランチ名を `codex/topic` の形で提案する。
4. 完了条件を、画面確認、テスト、ビルド、PR本文に分ける。
5. PM の次アクションを `承認`, `追加指示`, `保留` の判断に接続する。

## 出力

```markdown
## Webワークツリー
- タイトル:
- 目的:
- ブランチ:
- 対象範囲:
- 対象外:

## 完了条件
-

## 検証
- [ ] npm run lint
- [ ] npm test
- [ ] npm run build
- [ ] 画面確認

## PMの次アクション
-
```

## 実装に入る場合

実装依頼まで含まれている場合は、この整理を完了させてからコード変更に入る。曖昧なまま複数目的をまとめない。
