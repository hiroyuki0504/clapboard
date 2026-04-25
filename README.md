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

`/`、`/projects`、`/code-review` と `/api/*`（`/api/health`・`/api/login`・`/api/logout` を除く）は middleware で保護されており、`CLAPBOARD_ACCESS_TOKEN`（16文字以上）を一致させた利用者だけが閲覧できます。

```bash
# .env.local など
CLAPBOARD_ACCESS_TOKEN=<openssl rand -base64 32>
```

- 本番デプロイ前に必ず設定してください。未設定のまま `NODE_ENV=production` で起動した場合、保護対象は 503 を返します。
- ブラウザ利用時は `/login` ページでトークンを送信し、HttpOnly / SameSite=Lax / Secure な Cookie に保存します。
- API クライアントは `Authorization: Bearer <token>` でも認証できます。
- Cookie は7日で失効します。ログアウトする場合は `POST /api/logout` を呼び出してください。

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
