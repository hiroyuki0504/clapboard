# ClawBoard

Next.js App Router + TypeScript + Tailwind CSS で作成した、進捗管理ダッシュボードMVPです。

## ディレクトリ構成

```text
app/
  layout.tsx
  page.tsx
  globals.css
  api/
    health/
    projects/
    code-review/
  code-review/
    page.tsx
  projects/
    page.tsx
    [id]/page.tsx
components/
  dashboard/
  layout/
  projects/
  ui/
lib/
  clapboard-api.ts
  mock-data.ts
  types.ts
  utils.ts
```

## 実装ファイル

- `app/page.tsx` - 進捗ダッシュボードトップ
- `app/api/*` - 進捗・レビュー管制データのAPI Route
- `app/code-review/page.tsx` - PM向けブランチ/PR/Codexレビュー管理
- `app/projects/page.tsx` - 進捗一覧
- `app/projects/[id]/page.tsx` - 進捗詳細
- `components/layout/*` - macOS風トップバー、アイコンレール、FILESツリー
- `components/projects/*` - 進捗テーブル、詳細タブ
- `components/ui/*` - Button、Card、Badge、Progress
- `docs/pm-codex-review-system.md` - main管理とCodexレビュー運用案
- `scripts/codex-pr-review.sh` - Codexレビュー投入スクリプト
- `lib/clapboard-api.ts` - 外部バックエンド接続とモック退避をまとめたデータ層
- `lib/code-review-system.ts` - ブランチ/PRレビュー管理のモックデータ
- `lib/mock-data.ts` - モック進捗データ
- `lib/types.ts` - 型定義
- `lib/utils.ts` - 表示整形ユーティリティ

## 起動

```bash
npm install
npm run dev
```

## 主要ルート

- `/` - 進捗ダッシュボードトップ
- `/graph` - ワーク・タスク・ファイルの関係グラフ
- `/command` - AIエージェントの指示・実行ログ
- `/timeline` - 予定と実行履歴のタイムライン
- `/code-review` - PM main gate / Codexレビュー管理
- `/projects` - 進捗一覧
- `/projects/[id]` - 進捗詳細タブ

## API接続

Next.js API Route を追加済みです。外部バックエンドが未設定の環境では、既存のモックデータをローカルAPI経由で返します。

- `GET /api/health` - API接続状態。外部API設定済みで接続失敗した場合は `503`。
- `GET /api/projects` - 進捗一覧
- `GET /api/projects/[id]` - 進捗詳細
- `GET /api/code-review` - ブランチ/PRレビュー管制データ

外部バックエンドへ接続する場合は、`.env.local` に以下を設定してください。

```bash
CLAPBOARD_API_BASE_URL=https://example.com
CLAPBOARD_API_TOKEN=optional-token
CLAPBOARD_API_TIMEOUT_MS=5000
```

バックエンドは `/health`、`/projects`、`/projects/:id`、`/code-review` を返す想定です。取得に失敗した場合やタイムアウトした場合は既存モックデータへ退避します。APIデータを静的生成で固定しないよう、データ取得画面とAPI Routeは動的レンダリングにしています。ただし、外部バックエンドが `401` / `403` / `404` を返した場合は認可拒否・存在なしを隠さないため、モックへ退避せずエラーとして返します。

## アクセス制御

`/`、`/projects`、`/code-review` と `/api/*`（`/api/health`・`/api/login`・`/api/logout` を除く）は middleware で保護されています。トークンは2系統あり、ロールに応じて API 権限が変わります。

```bash
# .env.local など (16文字以上、推奨は `openssl rand -base64 32`)
CLAPBOARD_ACCESS_TOKEN=<admin token>
CLAPBOARD_VIEWER_TOKEN=<viewer token>   # 任意
```

| Role | 設定する変数 | 認可される操作 |
|---|---|---|
| admin | `CLAPBOARD_ACCESS_TOKEN` | 全Page + 全API（`GET/POST/PUT/PATCH/DELETE`） |
| viewer | `CLAPBOARD_VIEWER_TOKEN` | 全Page + GET API のみ。書き込みAPIは 403 |

- 本番デプロイ前に必ず admin を設定してください。両方未設定のまま `NODE_ENV=production` で起動した場合、保護対象は 503 を返します。
- ブラウザ利用時は `/login` ページでトークンを送信し、HttpOnly / SameSite=Lax / Secure な Cookie に保存します。
- API クライアントは `Authorization: Bearer <token>` でも認証できます。
- Cookie は7日で失効します。ログアウトする場合は `POST /api/logout` を呼び出してください。
- レスポンスヘッダ `x-clapboard-role` で当該リクエストのロールを返します（admin/viewer）。

### CSRF / レート制限

- `/api/*` の **書き込みリクエスト**（Bearer なし）は Origin / Referer / Sec-Fetch-Site で同一オリジン検証。GET は対象外（既定）。
- `/api/login` は IP単位 1分10回でレート制限。429 で `Retry-After` / `x-ratelimit-*` ヘッダを返却。
- レート制限ストアは Vercel KV / Upstash Redis REST API（`KV_REST_API_URL` + `KV_REST_API_TOKEN` を設定）。未設定または失敗時は Edge memory に自動 fallback します。

```bash
# 任意: Edge instance を跨いで一貫したレート制限を行うとき
KV_REST_API_URL=https://...upstash.io
KV_REST_API_TOKEN=...
```

### 副作用ある GET API を追加するときの運用ルール

外部状態を変更する GET エンドポイント（例: webhook 風、副作用 redirect）を追加する場合、ブラウザは `Origin` ヘッダを GET に付けないため、CSRF を強制する必要があります。

1. 該当 Route Handler を **POST に変更できないか** まず検討する。RFC 的にも副作用は POST が原則です。
2. POST に変更できない場合は、その Route Handler の先頭で `evaluateCsrf(request, { enforceOnGet: true })` を明示的に呼び出して 403 を返してください。
3. middleware 全体に `enforceOnGet: true` を入れると `/api/health` 等の単純GETがブラウザ間で取れなくなるため、**経路ごとに個別適用**する設計にしています。

## Team Roles

| Role | Responsibility |
|---|---|
| PM / Tech Lead | 仕様整理、タスク分解、PRレビュー、統合、デモ設計 |
| Developer | 機能実装、UI実装、バグ修正 |
| UI / Presentation | UI確認、動作テスト、スライド作成、発表補助 |

## ハッカソン審査基準に沿った運用方針

今回のテーマは「AIエージェントの可能性を拡張せよ」です。実装・レビュー・デモ準備では、単なる進捗管理ツールではなく、AIエージェントがチーム開発の判断、レビュー、統合、発表準備をどう拡張するかが伝わる体験を優先します。

| 審査項目 | 運用で意識すること |
|---|---|
| テーマ適合性 | 各機能・各PRが「AIエージェントの可能性をどう広げるか」を説明できる状態にする。進捗表示だけでなく、AIによるレビュー支援、統合判断、リスク検知、次アクション提示につながる変更を優先する。 |
| AIエージェントならではの体験 | 人間が手で見るダッシュボードに留めず、Codexレビュー、PRゲート、進捗要約、ブロッカー検知など、エージェントが開発チームの一員として働く動線をデモで見せられるようにする。 |
| 課題設定 | 解決する課題を「短時間開発でmainが壊れる」「PR状況が追えない」「レビュー判断が属人化する」「デモ直前に統合状況が見えない」など、ユーザーにとって価値のある開発運用課題として明確にする。 |
| 新規性 | 既存のタスク管理やCI表示の焼き直しではなく、AIレビュー結果・進捗・統合可否を同じ画面で扱い、PMとAIエージェントが一緒に開発管制する体験として見せる。 |
| 完成度 | デモで通す主要導線を絞り、`main` が常に起動できる状態、PRレビュー運用、API fallback、表示崩れの少なさを重視する。見せない機能より、見せる機能の安定性を優先する。 |

### 実装・PR判断のチェック

新しいタスクやPRを作る前に、以下の観点を確認します。

- この変更はハッカソンのテーマに対して説明しやすいか
- AIエージェントが関与する必然性があるか
- デモでユーザー課題と解決の流れを短く見せられるか
- 既存の進捗管理・PRレビュー運用とつながっているか
- 完成度を下げる未完成な導線や見せない機能を増やしていないか

### デモで見せるべき体験

デモでは、以下の流れを基本にします。

1. 開発チームの進捗・ブロッカー・PR状況をClawBoardで確認する
2. AIエージェントによるレビューやリスク検知で、次に見るべきPRや作業を判断する
3. PM / Tech Lead がAIの提案をもとに統合可否を決める
4. `main` を壊さず、短時間開発でもデモ可能な状態を維持できることを示す

## Development Workflow

このプロジェクトでは、短時間で安全に開発を進めるため、Pull Request ベースで開発します。

### Branch Rule

- `main` への直接 push は禁止
- 作業ごとに `feature/*` または `fix/*` ブランチを作成
- 1機能・1修正ごとに小さく Pull Request を作成

例:

```bash
git checkout -b feature/input-form
git checkout -b feature/ai-processing
git checkout -b fix/demo-layout
```

### Pull Request Rule

- PRは小さく出す
- 30〜60分ごとに進捗単位でPRを作成
- PRはPM / Tech Leadが確認してから `main` へマージ
- デモ前は動作確認済みのPRのみマージ
- デモ前は `main` が常に起動できる状態を保つ

### Review Checklist

PRでは以下を確認します。

- [ ] アプリが起動する
- [ ] デモに必要な機能か
- [ ] `main` を壊さない
- [ ] 画面表示が大きく崩れていない
- [ ] 不要なコードやログが残っていない

### Commit / PR Naming

PRタイトルは以下の形式を基本にします。

```text
feat: 入力フォームを追加
feat: AI処理APIを追加
fix: デモ画面のレイアウト崩れを修正
docs: READMEを更新
```

## PM / Codexレビュー運用

PRブランチ上で、mainとの差分をCodex CLIの標準モデルでレビューします。

```bash
npm run review:codex -- --base main --title "PRタイトル"
```

未コミット差分も含める場合:

```bash
npm run review:codex -- --uncommitted --title "作業中レビュー"
```

CLI側で利用できるモデルを明示したい場合だけ `--model <model-id>` を追加してください。

詳しい運用案は `docs/pm-codex-review-system.md` を参照してください。

Codexレビュアーのコメントは `1. Crucial`、`2. High Priority`、`3. Medium`、`4. Low` の4段階で扱います。PR作成者の必須対応範囲は `Crucial` と `High Priority` までです。

## Vercel

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- `package-lock.json` をコミットして、Next.js 15.5.15 と PostCSS override の組み合わせを固定してください。
- 公開ドメインは Vercel 側で `pm.ymt-systems.com` を追加し、DNS の CNAME/A レコードを案内通りに設定してください。
- 認証、DB、Google Drive OAuth接続は未実装です。MVPではAPI Route経由の進捗データ取得と外部URL表示まで対応しています。
