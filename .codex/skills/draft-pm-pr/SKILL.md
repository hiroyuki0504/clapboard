---
name: draft-pm-pr
description: "ClawBoardのPM判断に必要なPR本文を作成する。Use when drafting or reviewing a pull request body for this repository, especially when it must include summary, Web worktree context, changed scope, verification, PM decision points, and Codex review results."
---

# PM向けPR本文作成

## 概要

ClawBoard の PR ルールと `docs/pm-codex-review-system.md` のテンプレートを skill 化したもの。PM が main 取り込みを判断できる PR 本文に整える。

## 手順

1. 変更目的を1つに絞って概要を書く。
2. Webワークツリー、ブランチ、プレビュー、AIの現在ステップを埋める。
3. 変更範囲と対象外を分ける。
4. 実行した検証と未実行の検証を分ける。
5. main への影響、リリース順序、残リスク、追加指示が必要な点を書く。
6. Codex Review の実行コマンド、`Crucial` / `High Priority` / `Medium` / `Low`、対応状況を整理する。

## テンプレート

```markdown
## 概要
-

## Webワークツリー
- 依頼:
- ブランチ:
- プレビュー:
- AIの現在ステップ:

## 変更範囲
-

## 検証
- [ ] npm run lint
- [ ] npm test
- [ ] npm run build
- [ ] Codex review

## PM判断ポイント
- mainへの影響:
- リリース順序:
- 残リスク:
- 追加指示が必要な点:

## Codexレビュー結果
- 実行コマンド:
- Crucial:
- High Priority:
- Medium / Low:
- 対応状況:
```

## 注意

- `main` への直接反映を前提にした文面にしない。
- 未実行の検証を実行済みのように書かない。
- 残リスクがない場合も、確認した範囲を明示する。
