# ClawBoard

ClawBoard は、AIエージェントによる開発作業をブラウザ上で受け付け、Webワークツリー、プレビュー、PR、レビュー判断までを一画面で扱うための開発管制MVPです。

従来の「進捗管理ダッシュボード」ではなく、運用方針を **ターミナルを開かないノーコードAI開発管制** に寄せます。PMや非エンジニアは自然言語、GitHub Issue、レビュー結果を依頼として投入し、AIエージェントが作業ブランチ、検証、PR下書き、残リスクを返す前提です。

## 運用方針

ClawBoard の基本方針は次の通りです。

| 原則 | 方針 |
| --- | --- |
| Browser first | 作業依頼、状態確認、プレビュー確認、レビュー判断は `/code-review` を起点にする。 |
| Terminal as runner | ターミナルはAI実行基盤や保守用に限定し、通常の依頼者は直接触らない。 |
| OAuth first | Codex は API キーではなく ChatGPT/OAuth ログイン済み CLI を使う。 |
| One request, one worktree | 1つの依頼は1つのWebワークツリー、1つの作業ブランチ、1つのPR候補に閉じる。 |
| Main protected | `main` への直接反映は禁止し、PM承認とレビューを通ったPRだけを取り込む。 |
| PM gate | AIは実装とレビュー材料を作る。最終判断はPM / Tech Leadがブラウザ上で行う。 |

## ノーコード開発フロー

1. PMまたは依頼者が、自然言語、GitHub Issue、レビュー結果をClawBoardに投入する。
2. AIエージェントが依頼を小さな作業単位に分け、`codex/<topic>` ブランチ相当のWebワークツリーを作る。
3. Webワークツリーには、対象リポジトリ、ブランチ、プレビュー、PR下書き、現在のAI作業、次アクションを表示する。
4. PMはプレビューと差分レビューを見て、承認、追加指示、保留を選ぶ。
5. `Crucial` / `High Priority` のレビュー指摘が解消され、CIやビルドの最低限の確認が通ったものだけを `main` へ入れる。

## 主要ルート

| Route | 役割 |
| --- | --- |
| `/` | 進捗、ブロッカー、依頼、ファイルをまとめて見る管制トップ。 |
| `/code-review` | Webワークツリー、ノーコード依頼キュー、PRレビュー、PMゲート。 |
| `/projects` | 案件一覧と進捗ボード。 |
| `/projects/[id]` | 案件詳細、議事録、タスク、ファイル、レビュー。 |
| `/login` | ブラウザ利用者向けログイン。 |

## 現在のMVP範囲

実装済み:

- Next.js App Router + TypeScript + Tailwind CSS の画面実装
- `/code-review` のWebワークツリー管制UI
- ノーコード依頼キューのモックデータ
- PM向けPRレビューゲート
- Codexレビュー投入スクリプト
- ChatGPT/OAuthログイン前提のCodex CLI運用
- API Route経由のデータ取得と外部バックエンド fallback
- ログイン、Cookie認証、admin/viewer ロール
- `/api/files` のルート制限付きファイル一覧

未接続または今後の実装:

- GitHub APIからのIssue / Branch / PR実データ同期
- Codex Cloudまたは常駐runnerによるWebワークツリー実行
- プレビューURLの自動発行
- DB永続化
- Google Drive OAuth接続

## データ接続

外部バックエンド未設定時は、ローカルのモックデータを返します。外部バックエンドへ接続する場合は `.env.local` に設定します。

```bash
CLAPBOARD_API_BASE_URL=https://example.com
CLAPBOARD_API_TOKEN=optional-token
CLAPBOARD_API_TIMEOUT_MS=5000
```

想定API:

- `GET /health`
- `GET /projects`
- `GET /projects/:id`
- `GET /code-review`

`/code-review` payload には、既存の `branches` / `pullRequests` に加えて、今後の実データ接続用に `agentWorktrees` / `noCodeRequests` を含めます。

## 認証

`/`、`/projects`、`/code-review`、`/graph`、`/command`、`/timeline`、保護対象の `/api/*` は middleware で保護します。

```bash
CLAPBOARD_PASSWORD=<admin password>
CLAPBOARD_ACCESS_TOKEN=<admin token>
CLAPBOARD_VIEWER_TOKEN=<viewer token>
CLAPBOARD_JWT_SECRET=<optional signing secret>
```

- local dev で未設定の場合のみ、adminパスワード `password` が使えます。
- 本番では `CLAPBOARD_PASSWORD` または `CLAPBOARD_ACCESS_TOKEN` を必ず設定してください。
- viewer は閲覧とGET APIのみ許可します。
- admin は全Page/APIと書き込み系APIを許可します。
- `NODE_ENV=production` で認証情報が未設定の場合、保護対象は `503` を返します。

## Codex / OAuth運用

このプロジェクトのCodexレビューは API キーを使わず、ChatGPT/OAuthログイン済みのCodex CLIをrunnerとして使います。

初回または API キー運用から切り替える場合:

```bash
codex logout
codex login
codex login status
```

`codex login status` が `Logged in using ChatGPT` を返す状態にしてください。ブラウザログインできないターミナルでは次を使います。

```bash
codex login --device-auth
```

レビュー投入:

```bash
npm run review:codex -- --base main --title "PRタイトル"
npm run review:codex -- --uncommitted --title "作業中レビュー"
```

`scripts/codex-pr-review.sh` は ChatGPT/OAuth ログイン以外の状態では停止します。`OPENAI_API_KEY` をこのレビュー運用に使う必要はありません。

## 開発コマンド

```bash
npm install
npm run dev
npm run dev:bypass
npm run lint
npm test
npm run build
```

- `npm run dev`: 通常の開発サーバー。ログイン画面を通す。
- `npm run dev:bypass`: local dev の確認用。認証をバイパスする。
- `npm run lint`: TypeScript型チェック。
- `npm test`: テスト用tsconfigでビルドしてNode testを実行。
- `npm run build`: 本番ビルド確認。

## ディレクトリ構成

```text
app/
  (app)/
    page.tsx
    code-review/page.tsx
    projects/page.tsx
  api/
    code-review/
    files/
    health/
    login/
    logout/
    projects/
  login/page.tsx
components/
  auth/
  dashboard/
  layout/
  projects/
  ui/
lib/
  auth.ts
  clapboard-api.ts
  code-review-system.ts
  mock-data.ts
  project-selectors.ts
  types.ts
docs/
  pm-codex-review-system.md
scripts/
  codex-pr-review.sh
  codex-pr-review-comment.sh
```

## 実装判断

新しい機能は次の順で判断します。

1. `/code-review` のWebワークツリー運用に乗るか。
2. 依頼者がターミナルなしで状態を理解できるか。
3. AIが実行した作業、検証、残リスクがPM判断に使える形で残るか。
4. `main` に直接触らず、PRとレビューを経由できるか。
5. デモで「AIエージェントが開発チームの一員として働く」ことが説明できるか。

進捗表示だけの機能や、ターミナル操作を前提にした機能は優先度を下げます。ClawBoardの中心価値は、AIエージェントの作業をWeb上の管制対象に変えることです。

## PRルール

- `main` への直接pushは禁止。
- 原則 `codex/<topic>` ブランチで作業する。
- 1依頼 = 1 Webワークツリー = 1 PR。
- PR本文には変更概要、検証、残リスク、PM判断ポイントを書く。
- `Crucial` / `High Priority` の指摘はマージ前に対応する。
- `Medium` / `Low` はPMが今回対応、後続Issue化、許容を判断する。

PR本文テンプレート:

```markdown
## 概要
-

## Webワークツリー
- 依頼:
- ブランチ:
- プレビュー:

## 変更範囲
-

## 検証
- [ ] npm run lint
- [ ] npm test
- [ ] npm run build
- [ ] Codex review

## PM判断ポイント
- mainへの影響:
- 残リスク:
- 追加指示が必要な点:

## Codexレビュー結果
- Crucial:
- High Priority:
- Medium / Low:
- 対応状況:
```

## 本番運用

- 公開URL: `https://clapbot.ymt-systems.com`
- Build Command: `npm run build`
- Output Directory: `.next`
- 本番では認証情報と `CLAPBOT_FILES_ROOT` を必ず設定する。
- GitHub連携を入れる場合、GitHub Appまたは最小権限tokenでIssue / Branch / PRを同期する。
- Codex実行runnerはChatGPT/OAuthログイン済みCLIを前提にし、APIキーをブラウザやリポジトリへ置かない。
