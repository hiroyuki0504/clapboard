---
name: check-related-files
description: "clapboardの依頼に関連するファイルを確認順付きで整理する。Use when the user asks to inspect related files, identify affected routes, find source files for a feature, or gather implementation context before coding."
---

# 関連ファイル確認

## 概要

Command 画面の「関連ファイルを確認」を skill 化したもの。実装前に、どのファイルをどの順番で読むべきかを短く整理する。

## 手順

1. 依頼文から route、画面名、機能名、API、データ型のキーワードを拾う。
2. `rg --files` と `rg` で関連ファイルを探す。
3. 入口ファイル、表示コンポーネント、ロジック、型、テスト、ドキュメントに分ける。
4. 変更しそうなファイルと、読むだけでよいファイルを分ける。
5. 既存の未コミット変更がある場合は、触る前に差分を確認する。

## よく見る場所

- routes: `app/(app)/...`, `app/api/...`
- UI: `components/...`
- data and logic: `lib/...`
- tests: `tests/...`
- operations docs: `README.md`, `docs/pm-codex-review-system.md`
- review scripts: `scripts/codex-pr-review.sh`, `scripts/codex-pr-review-comment.sh`

## 出力

```markdown
## 確認順
1. path/to/file - 理由
2. path/to/file - 理由

## 変更候補
-

## 読むだけでよい候補
-

## 注意点
-
```

この skill だけを求められた場合は、勝手にコード変更へ進まない。
