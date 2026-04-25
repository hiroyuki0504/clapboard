# ClawBoard

受託制作・小規模チーム向けの AI案件運用OS MVP です。

このMVPでは、議事録を案件更新の入口として扱います。案件ごとに議事録ファイルを取り込み、モック抽出で `決定事項` `ToDo` `未確定事項` を生成し、人がレビューして案件表示へ反映します。

## 現在のMVP範囲

- 案件ダッシュボード
- 案件詳細
- 議事録ファイル取り込み (`.txt` / `.md`)
- モック抽出
- 決定事項 / ToDo / 未確定事項のレビュー
- ブラウザ保存での反映継続
- 収支とファイルの閲覧

## 想定ユーザー

- 受託制作の PM
- 小規模チームの進行管理担当
- 会議後の案件更新を素早く回したいチーム

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
  layout/
  projects/
  ui/
lib/
  mock-data.ts
  mock-extraction.ts
  types.ts
  utils.ts
```

## 主要ルート

- `/` - レビュー待ち、未確定事項、最近の議事録取り込みを確認するダッシュボード
- `/projects` - 案件一覧
- `/projects/[id]` - 案件詳細。議事録レビュー、決定事項、ToDo、未確定事項を扱う

## 起動

```bash
npm install
npm run dev
```

## 未実装

- 本物の AI API 連携
- DB 永続化
- Google Drive の自動整理
- 収支の異常検知
- 外部サービスとの本格連携

## 備考

- 現在はモックデータとブラウザ `localStorage` を前提にしています
- 収支とファイルは閲覧中心で、MVP ではレビュー体験を優先しています
- `package-lock.json` により Next.js 15.5.15 と PostCSS override の組み合わせを固定しています
