# Web Worktree / No-Code AI Development Operations

このドキュメントは、clapboardを「ターミナルを開かないAI開発管制」として運用するための詳細ルールです。従来のPRレビュー補助ではなく、自然言語やGitHub IssueをWebワークツリーに変換し、AIエージェントの作業、プレビュー、PR、レビュー判断をPMがブラウザで扱うことを前提にします。

## 目的

- 非エンジニアやPMが、ターミナルを開かずにAI開発依頼を投入できる。
- 依頼ごとにWebワークツリーを作り、作業ブランチ、プレビュー、PR下書き、残リスクを追跡する。
- `main` への直接変更を避け、PM承認済みのPRだけをマージする。
- Codexレビュー、CI、ビルド、PM判断材料をWeb上に集約する。
- APIキー運用を避け、ChatGPT/OAuthログイン済みのCodex CLIをrunnerとして使う。

## 基本フロー

1. 依頼者が `/code-review` から自然言語、GitHub Issue、レビュー結果を投入する。
2. PMまたはAIが依頼を小さく切り、目的と完了条件を1つに絞る。
3. AIエージェントが `codex/<topic>` 相当の作業ブランチを作り、Webワークツリーとして表示する。
4. AIが実装、型チェック、テスト、ビルド、プレビュー作成、PR下書きを進める。
5. PMがプレビュー、差分、Codexレビュー、残リスクをブラウザで確認する。
6. `Crucial` / `High Priority` の指摘を解消し、PMが `main` への取り込み可否を判断する。

## レイヤー

| レイヤー | 役割 |
| --- | --- |
| ノーコード依頼キュー | ブラウザ入力、GitHub Issue、レビュー結果をAI作業依頼として整理する。 |
| Webワークツリー | 依頼に対応する作業ブランチ、状態、プレビュー、PR下書き、次アクションを追跡する。 |
| Codex runner | ChatGPT/OAuthログイン済みのCodex CLIで実装・レビュー・検証を実行する。 |
| PMゲート | プレビュー、Codexレビュー、CI結果、残リスクを見て承認、追加指示、保留を判断する。 |
| GitHub同期 | Issue、Branch、PR、Reviewを外部データとして取り込み、clapboardに表示する。 |

## ブランチ / ワークツリールール

| 種別 | 命名 | 用途 |
| --- | --- | --- |
| AI実装 | `codex/<topic>` | Webワークツリーから起動するAI主体の実装。 |
| バグ修正 | `fix/<bug-name>` | 緊急修正または人手主体の修正。 |
| 調査 | `research/<topic>` | 実装前の検証や設計メモ。 |
| 雑務 | `chore/<topic>` | 依存更新、設定変更、ドキュメント整備。 |

原則は「1依頼 = 1 Webワークツリー = 1ブランチ = 1PR」です。UI変更、API変更、認証変更などレビュー観点が大きく違うものは分けます。

## Codex / OAuth運用

CodexレビューとAI実行は API キーではなく、Codex CLI の ChatGPT/OAuth ログインで実行します。

```bash
codex login status
```

`Logged in using ChatGPT` ではない場合:

```bash
codex logout
codex login
```

ブラウザログインできないターミナルでは:

```bash
codex login --device-auth
```

レビュー投入:

```bash
npm run review:codex -- --base main --title "PRタイトル"
npm run review:codex -- --uncommitted --title "作業中レビュー"
```

`scripts/codex-pr-review.sh` は ChatGPT/OAuth ログイン以外の状態では停止します。`OPENAI_API_KEY` はこの運用に不要です。

## レビュー優先度

Codexレビュアーのコメントには、必ず次の4段階の優先度を付けます。

| 順位 | 優先度 | 対応者 | マージ判断 | 基準 |
| --- | --- | --- | --- | --- |
| 1 | Crucial | PR作成者 | 未対応ならマージ不可 | 本番障害、データ破損、セキュリティ事故、明確な機能停止につながる指摘 |
| 2 | High Priority | PR作成者 | 原則マージ前に対応 | 主要導線の回帰、仕様逸脱、テスト不足など、PM承認前に潰すべき指摘 |
| 3 | Medium | PM判断 | 必要なら後続Issue化 | 品質改善、境界条件、保守性など、リスクを明示して後続対応に回せる指摘 |
| 4 | Low | PM判断 | 任意対応 | 軽微な表記、読みやすさ、将来の改善案 |

`Crucial` と `High Priority` はPR作成者がマージ前に対応します。`Medium` と `Low` はPMが今回対応、後続Issue化、許容を判断します。

## PR本文テンプレート

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
- Crucial:
- High Priority:
- Medium / Low:
- 対応状況:
```

## マージ条件

- Webワークツリーの依頼目的が1つに閉じている。
- PR差分が依頼目的に閉じている。
- プレビューまたは代替の確認材料がある。
- Codexレビューの `Crucial` と `High Priority` が解消済み。
- `npm run lint`、`npm test`、`npm run build` の最低限いずれか、できれば全てが通っている。
- PMがリリース順序、依存PR、残リスクを確認している。

## アクセス制御

- `/`、`/projects`、`/code-review`、`/graph`、`/command`、`/timeline` と保護対象の `/api/*` は `middleware.ts` で保護します。
- ブラウザは `/login` からCookieを取得します。
- CIや外部スクリプトは `Authorization: Bearer <token>` を使います。
- 本番では `CLAPBOARD_PASSWORD` または `CLAPBOARD_ACCESS_TOKEN` を必ず設定します。
- `CLAPBOARD_VIEWER_TOKEN` は閲覧専用ユーザー向けです。

## 外部接続方針

初期MVPはモックデータで状態を表示します。外部バックエンド接続時は `/api/code-review` の `agentWorktrees` / `noCodeRequests` をGitHub APIやCodex Cloud / runnerの実行結果に置き換えます。

接続する順序:

1. GitHub Issue / PR / Branch の読み取り同期
2. Webワークツリーの状態更新API
3. プレビューURLの登録
4. Codex runnerの実行結果登録
5. PM承認操作からPR review / merge queue へ連携

## このMVPで作成したもの

- `/code-review`: Webワークツリー、ノーコード依頼キュー、PRレビュー、PMゲート。
- `lib/code-review-system.ts`: 画面用の運用データ、Webワークツリー、レビュー方針。
- `lib/clapboard-api.ts`: 外部バックエンド接続とpayload検証。
- `scripts/codex-pr-review.sh`: ChatGPT/OAuthログイン前提のCodexレビュー投入スクリプト。
- `npm run review:codex`: スクリプト呼び出し。
