import type {
  MinuteImport,
  Project,
  ProjectAmbiguity,
  ProjectDecision,
} from "@/lib/types";
import { extractMinuteSuggestions } from "@/lib/mock-extraction";

export type MockProject = Project & {
  decisions: ProjectDecision[];
  ambiguities: ProjectAmbiguity[];
  imports: MinuteImport[];
};

function buildImport(entry: MinuteImport): MinuteImport {
  const suggestions = extractMinuteSuggestions(entry.body).map((suggestion) => ({
    ...suggestion,
    status: entry.extractionStatus === "reviewed" ? "accepted" : suggestion.status,
  }));

  return {
    ...entry,
    suggestions,
  };
}

export const projects: MockProject[] = [
  {
    id: "web-renewal",
    name: "コーポレートサイト刷新",
    client: "YMT Systems",
    status: "in-progress",
    progress: 68,
    lastUpdated: "2026-04-24T16:20:00+09:00",
    revenue: 1800000,
    cost: 620000,
    dueDate: "2026-05-20",
    owner: "山田 / 佐藤",
    summary:
      "ymt-systems.com のブランド更新に合わせたWeb制作案件。情報設計、UI刷新、問い合わせ導線の改善を中心に進行中。",
    updates: [
      {
        id: "u1",
        date: "2026-04-24T16:20:00+09:00",
        text: "トップページのワイヤーを確定。CTA文言のA案/B案をクライアント確認へ。",
      },
      {
        id: "u2",
        date: "2026-04-22T10:00:00+09:00",
        text: "CMS移行範囲を確定。既存ニュース記事は直近2年分のみ移行。",
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "トップページUI実装",
        completed: false,
        priority: "high",
        note: "ヒーローと実績セクションのレスポンシブ確認が必要。",
      },
      {
        id: "t2",
        title: "問い合わせフォームの項目整理",
        completed: true,
        priority: "medium",
        note: "営業部レビュー済み。文言だけ最終調整。",
      },
      {
        id: "t3",
        title: "CMS移行リスト作成",
        completed: false,
        priority: "medium",
        note: "旧サイトから対象URLを抽出中。",
      },
    ],
    minutes: [
      {
        id: "m1",
        title: "第4回 定例MTG",
        createdAt: "2026-04-24T15:00:00+09:00",
        participants: ["山田", "佐藤", "田中", "YMT広報"],
        body: "## 決定事項\n- トップページのファーストビューはサービス訴求を優先\n- お問い合わせ導線は全ページ右上に固定\n\n## TODO\n- 4/26までにA案のコピーを提出\n- 導入事例の掲載可否を確認",
      },
    ],
    decisions: [
      {
        id: "d-web-1",
        date: "2026-04-24T15:00:00+09:00",
        summary:
          "トップページのファーストビューはサービス訴求を優先する方針で合意した。",
        sourceMinuteId: "m1",
      },
      {
        id: "d-web-2",
        date: "2026-04-24T15:00:00+09:00",
        summary:
          "お問い合わせ導線は全ページ右上の固定CTAで統一することを決定した。",
        sourceMinuteId: "m1",
      },
    ],
    ambiguities: [
      {
        id: "a-web-1",
        kind: "unresolved-decision",
        summary:
          "導入事例の社名表記とロゴ利用可否が未回収で、実績セクションの確定が止まっている。",
        resolved: false,
        sourceMinuteId: "m1",
      },
      {
        id: "a-web-2",
        kind: "unresolved-decision",
        summary:
          "CMS移行対象の記事範囲は確認事項だったが、直近2年分のみ移行する方針で解消済み。",
        resolved: true,
        sourceMinuteId: "m1",
      },
    ],
    imports: [
      buildImport({
        id: "i-web-1",
        filename: "20260424_第4回定例MTG.md",
        createdAt: "2026-04-24T15:05:00+09:00",
        body:
          "## 決定事項\n- トップページのファーストビューはサービス訴求を優先\n- お問い合わせ導線は全ページ右上に固定\n\n## TODO\n- 4/26までにA案のコピーを提出\n- 導入事例の掲載可否を確認",
        extractionStatus: "reviewed",
        sourceMinuteId: "m1",
      }),
      buildImport({
        id: "i-web-2",
        filename: "20260422_CMS移行確認メモ.txt",
        createdAt: "2026-04-22T10:10:00+09:00",
        body:
          "## 決定事項\n- CMS移行対象の記事は直近2年分に絞る\n\n## TODO\n- 旧サイトのニュースURLを棚卸しする",
        extractionStatus: "reviewed",
      }),
    ],
    transactions: [
      {
        id: "f1",
        date: "2026-04-01",
        label: "着手金",
        type: "revenue",
        amount: 900000,
      },
      {
        id: "f2",
        date: "2026-04-12",
        label: "撮影外注費",
        type: "expense",
        amount: 220000,
      },
      {
        id: "f3",
        date: "2026-04-18",
        label: "UIデザイン費",
        type: "expense",
        amount: 400000,
      },
    ],
    files: [
      {
        id: "file1",
        name: "サイトマップ_v3",
        type: "sheet",
        updatedAt: "2026-04-24T12:15:00+09:00",
        url: "https://drive.google.com/",
      },
      {
        id: "file2",
        name: "トップページワイヤーフレーム",
        type: "slide",
        updatedAt: "2026-04-23T17:45:00+09:00",
        url: "https://drive.google.com/",
      },
    ],
  },
  {
    id: "ai-minutes",
    name: "AI議事録自動化",
    client: "OpenClaw Lab",
    status: "review",
    progress: 82,
    lastUpdated: "2026-04-25T09:40:00+09:00",
    revenue: 2400000,
    cost: 980000,
    dueDate: "2026-05-10",
    owner: "高橋 / AI Agent Team",
    summary:
      "会議音声から議事録、TODO、決定事項を抽出し、案件進捗へ反映する自動化PoC。OpenClaw連携を前提に設計。",
    updates: [
      {
        id: "u3",
        date: "2026-04-25T09:40:00+09:00",
        text: "議事録の要約テンプレートを確定。レビュー観点の差分表示を追加予定。",
      },
      {
        id: "u4",
        date: "2026-04-23T11:30:00+09:00",
        text: "タスク抽出精度の検証でF1 0.86を確認。曖昧な期限表現は要改善。",
      },
    ],
    tasks: [
      {
        id: "t4",
        title: "議事録テンプレートの最終レビュー",
        completed: false,
        priority: "high",
        note: "営業会議と開発定例の2種類を確認する。",
      },
      {
        id: "t5",
        title: "OpenClaw連携APIのスタブ作成",
        completed: true,
        priority: "high",
        note: "MVPではモックレスポンスで接続確認済み。",
      },
      {
        id: "t6",
        title: "未確定TODOの手動修正UI",
        completed: false,
        priority: "medium",
        note: "レビュー担当が一括承認できる操作にする。",
      },
    ],
    minutes: [
      {
        id: "m2",
        title: "PoCレビュー会",
        createdAt: "2026-04-25T09:00:00+09:00",
        participants: ["高橋", "中村", "OpenClaw PM"],
        body: "## 共有\n- 議事録生成は実運用レベルに近い\n- TODO抽出は担当者名の補完が課題\n\n## 次アクション\n- レビューUIに未確定ラベルを追加\n- ファイル整理エージェントの要件を分離",
      },
      {
        id: "m3",
        title: "技術検証メモ",
        createdAt: "2026-04-21T18:30:00+09:00",
        participants: ["AI Agent Team"],
        body: "## 検証結果\n- 音声文字起こし後のノイズ除去が有効\n- 会話の区切り推定は議題単位にする\n\n## リスク\n- 参加者名が省略された会話で担当者推定が弱い",
      },
    ],
    decisions: [
      {
        id: "d-ai-1",
        date: "2026-04-25T09:00:00+09:00",
        summary:
          "議事録要約テンプレートは現行案を基準にし、差分表示だけ追加する方針で揃えた。",
        sourceMinuteId: "m2",
      },
      {
        id: "d-ai-2",
        date: "2026-04-25T09:00:00+09:00",
        summary:
          "議事録生成MVPのレビューを優先し、ファイル整理要件は別トラックで扱うことにした。",
        sourceMinuteId: "m2",
      },
    ],
    ambiguities: [
      {
        id: "a-ai-1",
        kind: "unresolved-decision",
        summary:
          "要約、TODO、決定事項のどこまで一致すれば承認とみなすかが未定で、レビュー待ち基準が揃っていない。",
        resolved: false,
        sourceMinuteId: "m2",
      },
      {
        id: "a-ai-2",
        kind: "missing-due-date",
        summary:
          "「来週中」「できれば月内」のような曖昧な期限表現の正規化ルールが未確定。",
        resolved: false,
        sourceMinuteId: "m3",
      },
      {
        id: "a-ai-3",
        kind: "unclear-dependency",
        summary:
          "議事録生成とファイル整理要件の混在は解消し、ファイル整理側を別バックログへ分離済み。",
        resolved: true,
        sourceMinuteId: "m2",
      },
    ],
    imports: [
      buildImport({
        id: "i-ai-1",
        filename: "20260425_PoCレビュー会.md",
        createdAt: "2026-04-25T09:08:00+09:00",
        body:
          "## 決定事項\n- 議事録要約テンプレートは現行案を基準にする\n- ファイル整理要件は別トラックで扱う\n\n## 次アクション\n- レビューUIに未確定ラベルを追加\n\n## 確認\n- 承認条件をどこまで一致で揃えるか決める",
        extractionStatus: "extracted",
        sourceMinuteId: "m2",
      }),
      buildImport({
        id: "i-ai-2",
        filename: "20260424_営業会議サンプル議事録.txt",
        createdAt: "2026-04-24T19:20:00+09:00",
        body:
          "## TODO\n- 担当: 中村 商談サンプルの要約精度を確認\n- 来週中に営業会議テンプレートを見直す",
        extractionStatus: "extracted",
      }),
      buildImport({
        id: "i-ai-3",
        filename: "20260421_技術検証メモ.md",
        createdAt: "2026-04-21T18:35:00+09:00",
        body:
          "## 決定事項\n- 音声文字起こし後のノイズ除去を標準処理として採用する\n\n## 保留\n- 参加者名が省略された会話での担当者推定ルールを詰める",
        extractionStatus: "reviewed",
        sourceMinuteId: "m3",
      }),
    ],
    transactions: [
      {
        id: "f4",
        date: "2026-04-05",
        label: "PoC契約金",
        type: "revenue",
        amount: 1200000,
      },
      {
        id: "f5",
        date: "2026-04-20",
        label: "AI検証環境費",
        type: "expense",
        amount: 280000,
      },
      {
        id: "f6",
        date: "2026-04-25",
        label: "中間検収",
        type: "revenue",
        amount: 1200000,
      },
    ],
    files: [
      {
        id: "file3",
        name: "議事録生成プロンプト集",
        type: "docs",
        updatedAt: "2026-04-25T09:35:00+09:00",
        url: "https://drive.google.com/",
      },
      {
        id: "file4",
        name: "PoC精度検証レポート",
        type: "pdf",
        updatedAt: "2026-04-23T20:00:00+09:00",
        url: "https://drive.google.com/",
      },
    ],
  },
  {
    id: "sales-dashboard",
    name: "営業管理ダッシュボード",
    client: "Northstar Sales",
    status: "planning",
    progress: 35,
    lastUpdated: "2026-04-23T13:05:00+09:00",
    revenue: 1500000,
    cost: 360000,
    dueDate: "2026-06-05",
    owner: "鈴木",
    summary:
      "営業KPI、商談ステージ、月次売上見込みを可視化する管理画面。初期MVPではCSV連携と閲覧体験を優先。",
    updates: [
      {
        id: "u5",
        date: "2026-04-23T13:05:00+09:00",
        text: "KPI定義を整理。受注見込み、平均リードタイム、失注理由を初期対象にする。",
      },
    ],
    tasks: [
      {
        id: "t7",
        title: "KPIカードの情報設計",
        completed: true,
        priority: "medium",
        note: "経営層ビューと営業Mgrビューで粒度を分ける。",
      },
      {
        id: "t8",
        title: "CSVインポート項目の確定",
        completed: false,
        priority: "high",
        note: "既存SFAの出力フォーマットを確認中。",
      },
      {
        id: "t9",
        title: "商談ステージ別グラフ設計",
        completed: false,
        priority: "low",
        note: "初期は棒グラフと一覧の組み合わせで十分。",
      },
    ],
    minutes: [
      {
        id: "m4",
        title: "要件整理MTG",
        createdAt: "2026-04-22T14:00:00+09:00",
        participants: ["鈴木", "Northstar営業部"],
        body: "## 要望\n- 月次予測と未対応商談を最初に見たい\n- 入力画面より閲覧画面の完成度を優先\n\n## 保留\n- SFA直接連携はMVP後に判断",
      },
    ],
    decisions: [
      {
        id: "d-sales-1",
        date: "2026-04-22T14:00:00+09:00",
        summary:
          "MVPは入力画面より閲覧体験を優先し、月次予測と未対応商談を先に見せる方針で合意した。",
        sourceMinuteId: "m4",
      },
      {
        id: "d-sales-2",
        date: "2026-04-23T13:05:00+09:00",
        summary:
          "初期KPIは受注見込み、平均リードタイム、失注理由の3指標に絞って進める。",
        sourceMinuteId: "m4",
      },
    ],
    ambiguities: [
      {
        id: "a-sales-1",
        kind: "unresolved-decision",
        summary:
          "SFA直接連携はMVP後判断のままで、CSV運用だけで現場が回るか未確定。",
        resolved: false,
        sourceMinuteId: "m4",
      },
      {
        id: "a-sales-2",
        kind: "unclear-dependency",
        summary:
          "CSV初期対象カラムは確認事項だったが、初期画面に必要な列を優先対象として整理済み。",
        resolved: true,
        sourceMinuteId: "m4",
      },
    ],
    imports: [
      buildImport({
        id: "i-sales-1",
        filename: "20260422_要件整理MTG.md",
        createdAt: "2026-04-22T14:10:00+09:00",
        body:
          "## 決定事項\n- 月次予測と未対応商談を最初に見せる\n- 入力画面より閲覧画面を優先する\n\n## 保留\n- SFA直接連携はMVP後に判断する",
        extractionStatus: "reviewed",
        sourceMinuteId: "m4",
      }),
      buildImport({
        id: "i-sales-2",
        filename: "20260423_KPI定義メモ.txt",
        createdAt: "2026-04-23T13:15:00+09:00",
        body:
          "## 決定事項\n- 初期KPIは受注見込み、平均リードタイム、失注理由の3指標に絞る\n\n## 確認\n- CSV初期対象カラムの最終確定",
        extractionStatus: "reviewed",
      }),
    ],
    transactions: [
      {
        id: "f7",
        date: "2026-04-10",
        label: "設計フェーズ費用",
        type: "revenue",
        amount: 500000,
      },
      {
        id: "f8",
        date: "2026-04-18",
        label: "要件定義稼働",
        type: "expense",
        amount: 180000,
      },
    ],
    files: [
      {
        id: "file5",
        name: "営業KPI定義表",
        type: "sheet",
        updatedAt: "2026-04-23T13:00:00+09:00",
        url: "https://drive.google.com/",
      },
    ],
  },
  {
    id: "recruiting-tool",
    name: "採用管理ツール",
    client: "Bluegrain HR",
    status: "at-risk",
    progress: 54,
    lastUpdated: "2026-04-22T18:10:00+09:00",
    revenue: 2100000,
    cost: 1320000,
    dueDate: "2026-05-02",
    owner: "伊藤 / 山本",
    summary:
      "候補者管理、面接評価、選考ステータスを一元化する採用管理ツール。評価シート仕様の未確定がリスク。",
    updates: [
      {
        id: "u6",
        date: "2026-04-22T18:10:00+09:00",
        text: "評価項目の追加要望が発生。スコープ調整が必要。",
      },
      {
        id: "u7",
        date: "2026-04-20T16:45:00+09:00",
        text: "候補者一覧と面接詳細のプロトタイプを共有。",
      },
    ],
    tasks: [
      {
        id: "t10",
        title: "評価シート仕様の再合意",
        completed: false,
        priority: "high",
        note: "4/26までに追加項目の優先度を確認。",
      },
      {
        id: "t11",
        title: "候補者一覧フィルタ",
        completed: true,
        priority: "medium",
        note: "選考ステータス、職種、担当者で絞り込み可能。",
      },
      {
        id: "t12",
        title: "面接官コメント欄",
        completed: false,
        priority: "medium",
        note: "権限設計はMVP後に回す。",
      },
    ],
    minutes: [
      {
        id: "m5",
        title: "仕様調整MTG",
        createdAt: "2026-04-22T17:30:00+09:00",
        participants: ["伊藤", "山本", "Bluegrain採用責任者"],
        body: "## 論点\n- 評価シートの職種別分岐をMVPに含めるか\n- 面接官コメントの公開範囲\n\n## 判断\n- 追加要望は優先度を付けて5/2納期への影響を見積もる",
      },
    ],
    decisions: [
      {
        id: "d-rec-1",
        date: "2026-04-22T17:30:00+09:00",
        summary:
          "5/2納期を守る前提で、追加要望は納期影響を見積もってから採否を判断する運用にした。",
        sourceMinuteId: "m5",
      },
      {
        id: "d-rec-2",
        date: "2026-04-20T16:45:00+09:00",
        summary:
          "候補者一覧から面接詳細へ遷移する基本導線は現行プロトタイプを土台に進める。",
        sourceMinuteId: "m5",
      },
    ],
    ambiguities: [
      {
        id: "a-rec-1",
        kind: "unresolved-decision",
        summary:
          "評価シートの職種別分岐をMVPに含めるか未確定で、納期へ直接影響する。",
        resolved: false,
        sourceMinuteId: "m5",
      },
      {
        id: "a-rec-2",
        kind: "unresolved-decision",
        summary:
          "面接官コメントの公開範囲が決まっておらず、権限設計が止まっている。",
        resolved: false,
        sourceMinuteId: "m5",
      },
      {
        id: "a-rec-3",
        kind: "unresolved-decision",
        summary:
          "追加評価項目の必須・任意の整理が終わっておらず、再合意待ちになっている。",
        resolved: false,
        sourceMinuteId: "m5",
      },
      {
        id: "a-rec-4",
        kind: "unclear-dependency",
        summary:
          "候補者一覧の初期フィルタ条件は確認事項だったが、3軸で絞り込む方針で解消済み。",
        resolved: true,
        sourceMinuteId: "m5",
      },
    ],
    imports: [
      buildImport({
        id: "i-rec-1",
        filename: "20260422_仕様調整MTG.md",
        createdAt: "2026-04-22T17:42:00+09:00",
        body:
          "## 決定事項\n- 追加要望は優先度を付けて5/2納期への影響を見積もる\n\n## 確認\n- 評価シートの職種別分岐をMVPに含めるか\n- 面接官コメントの公開範囲をどうするか",
        extractionStatus: "extracted",
        sourceMinuteId: "m5",
      }),
      buildImport({
        id: "i-rec-2",
        filename: "20260421_候補者データサンプル.csv",
        createdAt: "2026-04-21T11:25:00+09:00",
        body:
          "## 決定事項\n- 候補者一覧の初期表示項目を現行サンプルに合わせる\n\n## 確認\n- 初期フィルタ条件を3軸に絞る",
        extractionStatus: "reviewed",
      }),
      buildImport({
        id: "i-rec-3",
        filename: "20260418_追加要望メモ.jpg",
        createdAt: "2026-04-18T19:10:00+09:00",
        body:
          "手書きメモ由来の追加要望をOCR取り込みしたが、評価項目の判読が不十分で再確認待ち。",
        extractionStatus: "pending",
      }),
    ],
    transactions: [
      {
        id: "f9",
        date: "2026-04-02",
        label: "着手金",
        type: "revenue",
        amount: 1000000,
      },
      {
        id: "f10",
        date: "2026-04-16",
        label: "追加設計稼働",
        type: "expense",
        amount: 460000,
      },
      {
        id: "f11",
        date: "2026-04-19",
        label: "フロント実装稼働",
        type: "expense",
        amount: 620000,
      },
    ],
    files: [
      {
        id: "file6",
        name: "採用管理ツール要件定義",
        type: "docs",
        updatedAt: "2026-04-22T18:00:00+09:00",
        url: "https://drive.google.com/",
      },
      {
        id: "file7",
        name: "候補者データサンプル",
        type: "sheet",
        updatedAt: "2026-04-21T11:25:00+09:00",
        url: "https://drive.google.com/",
      },
    ],
  },
];

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}

export const allFiles = projects
  .flatMap((project) =>
    project.files.map((file) => ({
      ...file,
      projectName: project.name,
    })),
  )
  .sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

export const allMinutes = projects
  .flatMap((project) =>
    project.minutes.map((minute) => ({
      ...minute,
      projectName: project.name,
    })),
  )
  .sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const allImports = projects
  .flatMap((project) =>
    project.imports.map((entry) => ({
      ...entry,
      projectId: project.id,
      projectName: project.name,
    })),
  )
  .sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const allAmbiguities = projects.flatMap((project) =>
  project.ambiguities.map((ambiguity) => ({
    ...ambiguity,
    projectId: project.id,
    projectName: project.name,
  })),
);

export const unresolvedAmbiguities = allAmbiguities.filter(
  (ambiguity) => !ambiguity.resolved,
);

export const reviewPendingImports = allImports.filter(
  (entry) => entry.extractionStatus !== "reviewed",
);
