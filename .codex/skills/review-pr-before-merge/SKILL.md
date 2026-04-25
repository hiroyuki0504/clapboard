---
name: review-pr-before-merge
description: "ClawBoardのmainマージ前PRレビューを行う。Use when Codex must review a branch, PR diff, or uncommitted changes before PM approval, using Crucial, High Priority, Medium, and Low priorities while focusing on regressions, security, data loss, broken flows, and missing tests."
---

# PR事前レビュー

## 概要

ClawBoard の `scripts/codex-pr-review.sh` で使っている main マージ前レビュー用プロンプトを skill 化したもの。PM がマージ判断に使えるように、指摘は優先度、場所、理由、修正方針まで揃える。

## 入力

- 対象ブランチまたは PR 差分
- base ブランチ。指定がなければ `main`
- PR タイトルまたは作業タイトル
- 追加観点。例: UI回帰、認証境界、外部URL、モックデータ整合性

## 手順

1. 差分の目的と実装範囲を確認する。
2. 変更ファイル、周辺コード、既存テストを読む。
3. 本番障害、データ破損、セキュリティ事故、主要導線の回帰、仕様逸脱、テスト不足を優先して探す。
4. 指摘は本当に修正判断に使えるものに絞る。
5. 問題がない場合も、確認した範囲と残リスクを短く報告する。

## 優先度

- `Crucial`: 本番障害、データ破損、セキュリティ事故、明確な機能停止。未対応ならマージ不可。
- `High Priority`: 主要導線の回帰、仕様逸脱、明確なテスト不足。原則マージ前に対応。
- `Medium`: 品質改善、境界条件、保守性。PM が今回対応か後続 Issue 化を判断。
- `Low`: 軽微な表記、読みやすさ、将来改善。PR 作成者への必須対応にしない。

## 出力

各指摘は次の形にする。

```markdown
## Findings
- [High Priority] タイトル
  - 場所: path/to/file.ts:123
  - 理由:
  - 修正方針:

## 残リスク
-

## 確認した検証
-
```

指摘がない場合は `Crucial / High Priority のブロッカーは見つかりませんでした` と明記し、未実行の検証があれば残リスクへ分ける。

## CLI

レビュー投入が必要なら、既存スクリプトを使う。

```bash
npm run review:codex -- --base main --title "PRタイトル"
npm run review:codex -- --uncommitted --title "作業中レビュー"
```
