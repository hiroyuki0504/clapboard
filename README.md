# ClawBoard

Next.js App Router + TypeScript + Tailwind CSS で作成した、案件管理ダッシュボードMVPです。

## ディレクトリ構成

```text
app/
  layout.tsx
  page.tsx
  globals.css
  projects/
    page.tsx
    [id]/page.tsx
components/
  dashboard/
  layout/
  projects/
  ui/
lib/
  mock-data.ts
  types.ts
  utils.ts
```

## 実装ファイル

- `app/page.tsx` - ダッシュボードトップ
- `app/projects/page.tsx` - 案件一覧
- `app/projects/[id]/page.tsx` - 案件詳細
- `components/layout/*` - macOS風トップバー、アイコンレール、FILESツリー
- `components/projects/*` - 案件テーブル、詳細タブ
- `components/ui/*` - Button、Card、Badge、Progress
- `lib/mock-data.ts` - モック案件データ
- `lib/types.ts` - 型定義
- `lib/utils.ts` - 表示整形ユーティリティ

## 起動

```bash
npm install
npm run dev
```

## 主要ルート

- `/` - ダッシュボードトップ
- `/projects` - 案件一覧
- `/projects/[id]` - 案件詳細タブ

## Vercel

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- `package-lock.json` をコミットして、Next.js 15.5.15 と PostCSS override の組み合わせを固定してください。
- 公開ドメインは Vercel 側で `pm.ymt-systems.com` を追加し、DNS の CNAME/A レコードを案内通りに設定してください。
- 認証、DB、Google Drive API接続は未実装です。MVPではモックデータと外部URL表示のみです。
