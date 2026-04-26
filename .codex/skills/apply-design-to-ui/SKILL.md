---
name: apply-design-to-ui
description: "Figmaやデザイン指示をClawBoardのUI実装差分へ変換する。Use when a design direction, screenshot, Figma note, or visual feedback must be decomposed into scoped UI changes using existing Next.js, Tailwind, and component patterns."
---

# デザインUI反映

## 概要

「デザイン差分を小さなUI変更に分解してAIに投入する」ための skill。ClawBoard の管制UIに合わせ、静かで実務的な画面密度と読みやすさを優先する。

## 手順

1. 対象 route と component を特定する。例: `/code-review`, `/projects/[id]`, `/command`
2. デザイン指示を、レイアウト、情報階層、状態表示、操作、レスポンシブの差分に分ける。
3. 既存の `components/ui`、カード、バッジ、レイアウトの使い方に合わせる。
4. テキストがカード、ボタン、バッジからはみ出さないように制約を決める。
5. データ構造や API を変えないで済む UI 変更なら、表示層だけに閉じる。
6. 変更後は該当ページの表示、狭い幅、主要状態を確認する。

## 出力

```markdown
## UI反映計画
- 対象画面:
- 変更するコンポーネント:
- デザイン差分:
- 対象外:

## 実装メモ
-

## 確認観点
- レスポンシブ:
- テキスト収まり:
- 状態表示:
- 既存UIとの一貫性:
```

## ClawBoardらしさ

- SaaS/管制ツールとして、装飾よりもスキャン性と操作の予測しやすさを優先する。
- 大きすぎるヒーロー、マーケティング調の構成、装飾的なカード増殖は避ける。
- 既存の落ち着いた色、密度、タイポグラフィの流れに合わせる。
