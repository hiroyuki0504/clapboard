---
name: turn-issue-into-pr
description: "GitHub IssueをClawBoardのAI作業と修正PRに変換する。Use when an Issue body should be treated as the specification, reproduced or clarified, implemented on a branch from main, verified, and drafted as a focused PR."
---

# Issue修正PR化

## 概要

「Issue本文を仕様として扱い、mainから作業ブランチを切って修正する」ための skill。

## 手順

1. Issue の目的、再現条件、期待挙動、受け入れ条件を抜き出す。
2. 不足情報を `仮定` と `確認したいこと` に分ける。実装を止めるほどでなければ合理的に仮定する。
3. 変更範囲を最小化し、1 Issue = 1 PR に閉じる。
4. ブランチ名は原則 `codex/issue-<number>-<topic>` にする。
5. 実装後に lint、test、build、または該当する画面確認を行う。
6. PR本文には Issue 由来の仕様、変更範囲、検証、残リスクを書く。

## 出力

```markdown
## Issue整理
- Issue:
- 期待成果:
- 再現条件:
- 受け入れ条件:

## 実装計画
- ブランチ:
- 変更範囲:
- 対象外:

## 検証
-

## PR本文メモ
-
```

## 注意

- Issue と無関係なリファクタリングを混ぜない。
- `main` へ直接入れない。
- 既存の未コミット変更を見つけても、依頼範囲外なら巻き戻さない。
