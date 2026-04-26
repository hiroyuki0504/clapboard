---
name: summarize-review-gate
description: "clapboardのCodex ReviewコメントをPMのマージ判断に変換する。Use when review results, PR comments, or findings must be sorted into author-required fixes, PM decisions, residual risks, and a concise merge recommendation."
---

# レビュー判断整理

## 概要

Codex Review の結果を、PM がブラウザ上で `承認 / 追加指示 / 保留` を選べる判断材料へ変換する。

## 入力

- レビューコメント一覧
- PR タイトル、ブランチ、base
- 変更概要と検証結果
- PM が気にしている観点。例: main 影響、リリース順序、残リスク

## 手順

1. コメントを `Crucial`, `High Priority`, `Medium`, `Low` に分ける。
2. `Crucial` と `High Priority` は PR 作成者のマージ前必須対応にする。
3. `Medium` と `Low` は PM 判断として、今回対応、後続 Issue 化、許容の候補に分ける。
4. 同じ原因のコメントはまとめ、重複した指摘は代表コメントへ寄せる。
5. マージ可否を `マージ不可`, `条件付き承認`, `承認可能` のどれかで明示する。

## 出力

```markdown
## マージ判断
- 判定:
- 理由:

## PR作成者の必須対応
- [Crucial]
- [High Priority]

## PM判断ポイント
- 今回対応:
- 後続Issue:
- 許容できる残リスク:

## 追加で確認すること
-
```

## 判断基準

- `Crucial` が未解決なら `マージ不可`。
- `High Priority` が未解決なら原則 `マージ不可`。PM が明示的に許容する場合だけ条件付きにする。
- `Medium` と `Low` だけなら、残リスクと検証状況を添えて `条件付き承認` または `承認可能` にする。
