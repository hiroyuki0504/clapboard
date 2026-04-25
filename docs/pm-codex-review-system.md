# PM Main Gate / Codex Review System

このドキュメントは、PMが `main` を管理し、作業ブランチとPull Requestを分け、PR送信時にCodexレビューを投入するための運用案です。

## 目的

- `main` への直接変更を避け、PM承認済みのPRだけをマージする。
- 作業ブランチを目的単位に分け、レビュー範囲を小さく保つ。
- PRごとにCodexレビューを実行し、PMは優先度付きコメントの解消状況を見て判断する。
- CI、ビルド、レビュー指摘、残リスクをPR本文に集約する。

## 基本フロー

1. PMが要望を受け、目的と完了条件を1つに絞る。
2. 作業者またはCodexが `codex/<scope>-<topic>` 形式でブランチを切る。
3. 作業完了後、PR本文に変更概要、検証、残リスクを書く。
4. PRブランチでCodexレビューを実行する。
5. `Crucial` と `High Priority` の指摘をPR作成者が修正し、必要なら再レビューする。
6. PMがCI、差分、レビュー結果、リリース順序を確認して `main` にマージする。

## ブランチルール

| 種別 | 命名 | 用途 |
| --- | --- | --- |
| 機能追加 | `codex/<feature-name>` | CodexまたはAIエージェント主体の実装 |
| バグ修正 | `fix/<bug-name>` | 人手または緊急修正 |
| 調査 | `research/<topic>` | 実装前の検証や設計メモ |
| 雑務 | `chore/<topic>` | 依存更新、設定変更、ドキュメント整備 |

原則は「1目的 = 1ブランチ = 1PR」です。UI変更とデータ構造変更など、レビュー観点が大きく違うものは分けます。

## Codexレビュー

このリポジトリではレビュー投入用のラッパーを追加しています。

```bash
npm run review:codex -- --base main --title "PRタイトル"
```

未コミット差分も含めて確認したい場合:

```bash
npm run review:codex -- --uncommitted --title "作業中レビュー"
```

ラッパー内部では Codex CLI の `codex review` を呼び出します（おおむね以下に相当）。

```bash
codex review --base main --title "PRタイトル"
```

CLI側で利用できるモデルを明示したい場合だけ `--model <model-id>` を追加してください。

レビューでは次を優先します。

- 重大な不具合、回帰、データ破損、セキュリティリスク
- mainマージ後に戻しにくい設計変更
- テスト、ビルド、型チェックの不足
- PR本文に残すべきPM判断材料

## レビュー返信プライオリティ

Codexレビュアーのコメントには、必ず次の4段階の優先度を付けます。

| 順位 | 優先度 | 対応者 | マージ判断 | 基準 |
| --- | --- | --- | --- | --- |
| 1 | Crucial | PR作成者 | 未対応ならマージ不可 | 本番障害、データ破損、セキュリティ事故、明確な機能停止につながる指摘 |
| 2 | High Priority | PR作成者 | 原則マージ前に対応 | 主要導線の回帰、仕様逸脱、テスト不足など、PM承認前に潰すべき指摘 |
| 3 | Medium | PM判断 | 必要なら後続Issue化 | 品質改善、境界条件、保守性など、リスクを明示して後続対応に回せる指摘 |
| 4 | Low | PM判断 | 任意対応 | 軽微な表記、読みやすさ、将来の改善案 |

PRを出した人には、`Crucial` と `High Priority` までを対応してもらいます。`Medium` と `Low` はPMが今回のPRで直すか、後続Issueにするか、許容するかを判断します。

## PR本文テンプレート

```markdown
## 概要
-

## 変更範囲
-

## 検証
- [ ] npm run build
- [ ] Codex review

## PM判断ポイント
- mainへの影響:
- リリース順序:
- 残リスク:

## Codexレビュー結果
- 実行コマンド:
- Crucial:
- High Priority:
- Medium / Low:
- 対応状況:
```

## アクセス制御

- `/`、`/projects`、`/code-review` と `/api/*`（health/login/logout を除く）は `middleware.ts` で `CLAPBOARD_ACCESS_TOKEN` を必須にしています。
- ブラウザは `/login` ページから Cookie を取得、CI や外部スクリプトは `Authorization: Bearer <token>` で接続します。
- 本番では `CLAPBOARD_ACCESS_TOKEN` を Secrets/環境変数で配布してください。未設定のまま `NODE_ENV=production` で起動すると保護対象は 503 を返します。

## マージ条件

- `main` との差分がPR目的に閉じている。
- Codexレビューの `Crucial` と `High Priority` が解消済み。
- CI、型チェック、ビルドの最低限いずれかが通っている。
- PMがリリース順序、依存PR、残リスクを確認している。

## このMVPで作成したもの

- `/code-review`: PMがブランチ、PR、Codexレビュー状態を確認する管理画面。
- `lib/code-review-system.ts`: 画面用の運用データとレビュー方針。
- `scripts/codex-pr-review.sh`: Codexレビュー投入用スクリプト。
- `npm run review:codex`: スクリプトを呼び出すnpmコマンド。
