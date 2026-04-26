# clapboard

**clapboard は、ターミナルも Git も触らない PM・非エンジニアが、AI エージェントへの開発依頼から差分確認・PR レビュー承認までをブラウザだけで完結できる、ノーコード AI 開発管制 MVP です。**

「自然言語で依頼を投げる → AI が作業ブランチで実装する → PM がブラウザで差分・検証・残リスクを見て承認する」という流れを、`/code-review` 一画面に集約しています。従来の進捗管理ダッシュボードではなく、AI エージェントを「開発チームの一員」として運用するための管制盤を目指します。

## ハッカソンデモ（所要 2〜3 分）

**デモ動線**:

1. `/login` でログイン（local dev は admin パスワード `password`）。
2. `/code-review` を開く。**ここがメイン**。Web ワークツリー、ノーコード依頼キュー、PR レビューゲートが並び、PM がブラウザで承認 / 追加指示 / 保留を選べる。
3. （余裕があれば）`/`（管制トップ）で進捗・議事録・依存グラフ・最近の案件を俯瞰し、`/projects/[id]` で案件詳細を見せる。

**今回の MVP でやっていること**:

- ノーコード依頼キュー / Web ワークツリー UI（`/code-review`）
- PM 向け PR レビューゲートと Codex レビュー投入スクリプト
- ログイン、Cookie 認証、admin / viewer ロール、保護ルートの middleware
- API Route 経由のデータ取得（外部バックエンド未設定時はローカルモックに fallback）

**まだモック / 未接続のもの**（審査員向け）:

- GitHub からの Issue / Branch / PR 実データ同期（現在はモックデータ）
- Codex Cloud または常駐 runner による Web ワークツリーの自動実行（現在は手動 CLI）
- プレビュー URL の自動発行（現在は表示枠のみ）
- DB 永続化、Google Drive OAuth 連携

**次に繋ぐなら**: GitHub App での Issue / PR 双方向同期 → 常駐 runner（Codex Cloud or 自前）→ DB 永続化、の順でモックを実データに差し替えます。

## 名称について

このプロジェクトは歴史的経緯で 3 つの表記が残っているため、本リポジトリでは次のように使い分けます。

| 用途 | 表記 |
| --- | --- |
| プロダクト名 / UI 表示 / ドキュメント本文 | **clapboard**（正式名） |
| リポジトリ / npm パッケージ / `lib/clapboard-api.ts` などの import パス | `clapboard`（slug） |
| 公開 URL のホスト名 / セッション Cookie 名 | `clapbot`（legacy slug） |

新規の文章・画面表示は **clapboard** に統一します。`clapboard` / `clapbot` はコード上の識別子として残しますが、ユーザーに見せる箇所では使いません。

## 運用方針

clapboard の基本方針は次の通りです。

| 原則 | 方針 |
| --- | --- |
| Browser first | 作業依頼、状態確認、プレビュー確認、レビュー判断は `/code-review` を起点にする。 |
| Terminal as runner | ターミナルはAI実行基盤や保守用に限定し、通常の依頼者は直接触らない。 |
| OAuth first | Codex は API キーではなく ChatGPT/OAuth ログイン済み CLI を使う。 |
| One request, one worktree | 1つの依頼は1つのWebワークツリー、1つの作業ブランチ、1つのPR候補に閉じる。 |
| Main protected | `main` への直接反映は禁止し、PM承認とレビューを通ったPRだけを取り込む。 |
| PM gate | AIは実装とレビュー材料を作る。最終判断はPM / Tech Leadがブラウザ上で行う。 |

## ノーコード開発フロー

1. PMまたは依頼者が、自然言語、GitHub Issue、レビュー結果をclapboardに投入する。
2. AIエージェントが依頼を小さな作業単位に分け、`codex/<topic>` ブランチ相当のWebワークツリーを作る。
3. Webワークツリーには、対象リポジトリ、ブランチ、プレビュー、PR下書き、現在のAI作業、次アクションを表示する。
4. PMはプレビューと差分レビューを見て、承認、追加指示、保留を選ぶ。
5. `Crucial` / `High Priority` のレビュー指摘が解消され、CIやビルドの最低限の確認が通ったものだけを `main` へ入れる。

## 主要ルート

| Route | 役割 |
| --- | --- |
| `/` | ハッカソンデモ用に `/code-review` へ遷移する入口。 |
| `/dashboard` | 進捗、ブロッカー、依頼、ファイルをまとめて見る管制トップ。 |
| `/code-review` | Webワークツリー、ノーコード依頼キュー、PRレビュー、PMゲート。 |
| `/projects` | 案件一覧と進捗ボード。 |
| `/projects/[id]` | 案件詳細、議事録、タスク、ファイル、レビュー。 |
| `/login` | ブラウザ利用者向けログイン。 |

## 現在のMVP範囲

ハッカソン向けのサマリは [ハッカソンデモ](#ハッカソンデモ所要-23-分) を参照してください。以下は技術詳細を含む完全版です。

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

`/`、`/dashboard`、`/projects`、`/code-review`、`/graph`、`/command`、`/timeline`、保護対象の `/api/*` は middleware で保護します。

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

今回のハッカソンで使ったこのリポジトリの作業ツリーを基準にしています。`.env.local`、`.next/`、`node_modules/`、`tsconfig.tsbuildinfo` などのローカル生成物や秘密情報は除外します。

```text
.
|-- app/
|   |-- (app)/
|   |   |-- code-review/page.tsx
|   |   |-- command/page.tsx
|   |   |-- dashboard/page.tsx
|   |   |-- graph/page.tsx
|   |   |-- guide/page.tsx
|   |   |-- layout.tsx
|   |   |-- page.tsx
|   |   |-- projects/
|   |   |   |-- [id]/page.tsx
|   |   |   `-- page.tsx
|   |   `-- timeline/page.tsx
|   |-- api/
|   |   |-- code-review/route.ts
|   |   |-- files/route.ts
|   |   |-- health/route.ts
|   |   |-- login/route.ts
|   |   |-- logout/route.ts
|   |   `-- projects/
|   |       |-- [id]/route.ts
|   |       `-- route.ts
|   |-- favicon.ico
|   |-- globals.css
|   |-- icon.png
|   |-- layout.tsx
|   `-- login/page.tsx
|-- components/
|   |-- auth/login-form.tsx
|   |-- code-review/
|   |   |-- agent-worktrees-card.tsx
|   |   |-- branch-table-card.tsx
|   |   |-- hackathon-intake-demo.tsx
|   |   |-- header-section.tsx
|   |   |-- metric-tile.tsx
|   |   |-- no-code-request-queue.tsx
|   |   |-- oauth-runner-card.tsx
|   |   |-- pipeline-steps-card.tsx
|   |   |-- policy-list-card.tsx
|   |   |-- priority-level-table.tsx
|   |   `-- pull-request-queue.tsx
|   |-- dashboard/
|   |   |-- command-header.tsx
|   |   |-- dependency-graph-card.tsx
|   |   |-- files-section.tsx
|   |   |-- finance-section.tsx
|   |   |-- guide-section.tsx
|   |   |-- metric-card.tsx
|   |   |-- minutes-section.tsx
|   |   |-- progress-agent-log.tsx
|   |   |-- recent-projects-section.tsx
|   |   |-- stat-pills.tsx
|   |   |-- todo-section.tsx
|   |   |-- weekly-progress-card.tsx
|   |   |-- welcome-card.tsx
|   |   `-- _shared.tsx
|   |-- graph/graph-canvas.tsx
|   |-- layout/
|   |   |-- app-shell.tsx
|   |   |-- file-panel.tsx
|   |   |-- file-tree.tsx
|   |   |-- mobile-nav.tsx
|   |   |-- nav-items.ts
|   |   |-- sidebar.tsx
|   |   |-- topbar.tsx
|   |   |-- workspace-summary.tsx
|   |   `-- workspace-tabs.tsx
|   |-- projects/
|   |   |-- detail-tabs/
|   |   |   |-- files-tab.tsx
|   |   |   |-- finance-tab.tsx
|   |   |   |-- minutes-tab.tsx
|   |   |   |-- overview-tab.tsx
|   |   |   |-- progress-tab.tsx
|   |   |   |-- review-suggestion-card.tsx
|   |   |   |-- review-tab.tsx
|   |   |   |-- tab-button.tsx
|   |   |   |-- tab-config.ts
|   |   |   |-- use-review-sources.ts
|   |   |   |-- use-tab-navigation.ts
|   |   |   `-- _shared.tsx
|   |   |-- project-board-client.tsx
|   |   |-- project-detail-tabs.tsx
|   |   `-- project-table.tsx
|   |-- timeline/timeline-grid.tsx
|   |-- ui/
|   |   |-- badge.tsx
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   `-- progress.tsx
|   `-- project-status-badge.tsx
|-- lib/
|   |-- auth.ts
|   |-- board-settings.ts
|   |-- clapboard-api.ts
|   |-- clapboard-api-validators.ts
|   |-- code-review-meta.ts
|   |-- code-review-mock.ts
|   |-- code-review-system.ts
|   |-- command-agent-log.ts
|   |-- file-tree-api.ts
|   |-- graph-model.ts
|   |-- mock-data.ts
|   |-- mock-extraction.ts
|   |-- project-href.ts
|   |-- project-selectors.ts
|   |-- session.ts
|   |-- suggestion-context.ts
|   |-- suggestion-state.ts
|   |-- timeline-events.ts
|   |-- types.ts
|   `-- utils.ts
|-- tests/
|   |-- auth.test.ts
|   |-- code-review-system.test.ts
|   |-- mock-data-integrity.test.ts
|   |-- mock-extraction.test.ts
|   |-- progress.test.ts
|   |-- project-selectors.test.ts
|   |-- session.test.ts
|   |-- suggestion-state.test.ts
|   |-- ui-regression.test.ts
|   `-- utils.test.ts
|-- docs/
|   |-- pm-codex-review-system.md
|   `-- prompt-skill-map.md
|-- scripts/
|   |-- codex-pr-review-comment.sh
|   |-- codex-pr-review.sh
|   `-- deploy.sh
|-- .codex/skills/
|   |-- apply-design-to-ui/
|   |-- check-related-files/
|   |-- draft-pm-pr/
|   |-- extract-blockers/
|   |-- extract-minutes-actions/
|   |-- prepare-web-worktree/
|   |-- review-pr-before-merge/
|   |-- summarize-review-gate/
|   |-- turn-issue-into-pr/
|   `-- write-daily-brief/
|-- .github/
|   |-- pull_request_template.md
|   `-- workflows/
|       |-- ci.yml
|       `-- deploy.yml
|-- .env.example
|-- .gitignore
|-- .node-version
|-- AGENTS.md
|-- README.md
|-- ecosystem.config.cjs
|-- middleware.ts
|-- next-env.d.ts
|-- next.config.ts
|-- package-lock.json
|-- package.json
|-- postcss.config.mjs
|-- tailwind.config.ts
|-- tsconfig.json
`-- tsconfig.test.json
```

## 実装判断

新しい機能は次の順で判断します。

1. `/code-review` のWebワークツリー運用に乗るか。
2. 依頼者がターミナルなしで状態を理解できるか。
3. AIが実行した作業、検証、残リスクがPM判断に使える形で残るか。
4. `main` に直接触らず、PRとレビューを経由できるか。
5. デモで「AIエージェントが開発チームの一員として働く」ことが説明できるか。

進捗表示だけの機能や、ターミナル操作を前提にした機能は優先度を下げます。clapboardの中心価値は、AIエージェントの作業をWeb上の管制対象に変えることです。

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
