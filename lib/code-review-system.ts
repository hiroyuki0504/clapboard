export type BranchWorkstreamStatus =
  | "design"
  | "implementing"
  | "review-ready"
  | "changes-requested"
  | "approved";

export type ReviewState = "queued" | "running" | "needs-fix" | "passed";

export type MergeGate = "open" | "blocked" | "ready";

export type ReviewPriority = "crucial" | "high" | "medium" | "low";

export type ReviewCommentStatus = "open" | "fixed" | "accepted-risk";

export type ReviewPriorityLevel = {
  priority: ReviewPriority;
  rank: 1 | 2 | 3 | 4;
  label: string;
  owner: "PR作成者" | "PM判断";
  mergeRule: string;
  body: string;
};

export type CodexReviewComment = {
  id: string;
  priority: ReviewPriority;
  status: ReviewCommentStatus;
  title: string;
  body: string;
};

export type BranchWorkstream = {
  id: string;
  title: string;
  branch: string;
  base: string;
  owner: string;
  status: BranchWorkstreamStatus;
  pullRequest: string;
  dueAt: string;
  risk: "low" | "medium" | "high";
  nextAction: string;
};

export type PullRequestReview = {
  id: string;
  title: string;
  branch: string;
  base: string;
  author: string;
  reviewState: ReviewState;
  gate: MergeGate;
  changedFiles: number;
  riskAreas: string[];
  comments: CodexReviewComment[];
  codexCommand: string;
};

export const reviewSystem = {
  repository: "clapboard",
  mainBranch: "main",
  pmOwner: "PM / main 管理者",
  reviewModel: "Codex CLI標準モデル",
  codexModelId: "default",
  codexReviewCommand:
    'npm run review:codex -- --base main --title "main へのマージ前レビュー"',
  priorityLevels: [
    {
      priority: "crucial",
      rank: 1,
      label: "Crucial",
      owner: "PR作成者",
      mergeRule: "未対応ならマージ不可",
      body: "本番障害、データ破損、セキュリティ事故、明確な機能停止につながる指摘。",
    },
    {
      priority: "high",
      rank: 2,
      label: "High Priority",
      owner: "PR作成者",
      mergeRule: "原則マージ前に対応",
      body: "主要導線の回帰、仕様逸脱、テスト不足など、PM承認前に潰すべき指摘。",
    },
    {
      priority: "medium",
      rank: 3,
      label: "Medium",
      owner: "PM判断",
      mergeRule: "必要なら後続Issue化",
      body: "品質改善、境界条件、保守性など、リスクを明示して後続対応に回せる指摘。",
    },
    {
      priority: "low",
      rank: 4,
      label: "Low",
      owner: "PM判断",
      mergeRule: "任意対応",
      body: "軽微な表記、読みやすさ、将来の改善案。PR作成者への必須対応にはしない。",
    },
  ] satisfies ReviewPriorityLevel[],
  policies: [
    {
      id: "main-lock",
      title: "main はPM承認のみ",
      value: "direct push 0件",
      body: "main への変更はPR経由に限定し、PM承認とレビュー完了をマージ条件にする。",
    },
    {
      id: "branch-split",
      title: "作業単位でブランチ分離",
      value: "1目的 = 1PR",
      body: "機能、修正、調査を混ぜず、差分の責任範囲を追いやすくする。",
    },
    {
      id: "codex-review",
      title: "PRごとにCodexレビュー",
      value: "Codex CLI標準",
      body: "PR送信時にCodex reviewを投入し、コメントには必ず4段階の優先度を付ける。",
    },
    {
      id: "author-response",
      title: "作成者の必須対応範囲",
      value: "1-2 必須",
      body: "PR作成者にはCrucialとHigh Priorityまでを対応してもらい、Medium以下はPMが判断する。",
    },
  ],
  pipeline: [
    {
      id: "intake",
      title: "PM受付",
      body: "要望をmainへ直接入れず、目的と完了条件を1つに絞る。",
    },
    {
      id: "branch",
      title: "ブランチ分け",
      body: "codex/<scope>-<topic> で作業ブランチを作る。",
    },
    {
      id: "pull-request",
      title: "PR作成",
      body: "変更範囲、確認観点、残リスクをPR本文に固定で残す。",
    },
    {
      id: "codex-review",
      title: "Codex Review",
      body: "codex review --base main を実行し、Crucial / High Priorityを先に潰す。",
    },
    {
      id: "pm-merge",
      title: "PM承認/マージ",
      body: "レビュー通過、CI通過、目的達成を確認してmainへ入れる。",
    },
  ],
  branches: [
    {
      id: "progress-rebrand",
      title: "進捗管理リブランド",
      branch: "codex/progress-management-rebrand",
      base: "main",
      owner: "PM + Codex",
      status: "review-ready",
      pullRequest: "PR-12",
      dueAt: "2026-04-25T18:00:00+09:00",
      risk: "medium",
      nextAction: "Codexレビューを投入し、UI回帰とビルド結果を確認する。",
    },
    {
      id: "drive-sync",
      title: "Google Drive連携設計",
      branch: "codex/drive-sync-planning",
      base: "main",
      owner: "AI Agent Team",
      status: "design",
      pullRequest: "未作成",
      dueAt: "2026-04-27T12:00:00+09:00",
      risk: "low",
      nextAction: "API接続範囲と権限モデルを分けて設計PRにする。",
    },
    {
      id: "review-automation",
      title: "PRレビュー自動投入",
      branch: "codex/codex-review-gate",
      base: "main",
      owner: "PM",
      status: "implementing",
      pullRequest: "draft",
      dueAt: "2026-04-26T15:00:00+09:00",
      risk: "high",
      nextAction: "PR作成時の実行手順と失敗時のPM判断ルールを確定する。",
    },
  ] satisfies BranchWorkstream[],
  pullRequests: [
    {
      id: "pr-12",
      title: "進捗管理UIのリブランド",
      branch: "codex/progress-management-rebrand",
      base: "main",
      author: "Codex",
      reviewState: "queued",
      gate: "blocked",
      changedFiles: 17,
      riskAreas: ["UI表示崩れ", "モックデータ整合性", "Next.js build", "review wrapper"],
      comments: [
        {
          id: "c-12-1",
          priority: "high",
          status: "open",
          title: "レスポンシブ崩れの確認が不足",
          body: "新しい管制画面は横幅の狭い状態でカード密度が高いため、PR作成者が表示確認を行う。",
        },
        {
          id: "c-12-2",
          priority: "medium",
          status: "open",
          title: "レビューキューの並び順",
          body: "未対応の高優先度コメントを上に出す改善は後続Issue化でよい。",
        },
      ],
      codexCommand:
        'npm run review:codex -- --base main --title "進捗管理UIのリブランド"',
    },
    {
      id: "pr-13",
      title: "Drive URL管理の接続準備",
      branch: "codex/drive-sync-planning",
      base: "main",
      author: "AI Agent Team",
      reviewState: "needs-fix",
      gate: "blocked",
      changedFiles: 5,
      riskAreas: ["認証境界", "外部URL表示", "エラー時の退避"],
      comments: [
        {
          id: "c-13-1",
          priority: "crucial",
          status: "open",
          title: "Drive認証の失敗時動作が未定義",
          body: "認証失敗時にURLや権限情報が誤表示される可能性があるため、PR作成者がマージ前に修正する。",
        },
        {
          id: "c-13-2",
          priority: "high",
          status: "open",
          title: "外部URLの検証が不足",
          body: "不正URLを保存しないための検証ルールを追加する。",
        },
      ],
      codexCommand:
        'npm run review:codex -- --base main --title "Drive URL管理の接続準備"',
    },
    {
      id: "pr-14",
      title: "議事録テンプレート改善",
      branch: "codex/minutes-template-review",
      base: "main",
      author: "Codex",
      reviewState: "passed",
      gate: "ready",
      changedFiles: 3,
      riskAreas: ["文言回帰", "Markdown表示"],
      comments: [
        {
          id: "c-14-1",
          priority: "low",
          status: "accepted-risk",
          title: "テンプレート文言の微調整",
          body: "運用開始後の利用者フィードバックに合わせて調整する。",
        },
        {
          id: "c-14-2",
          priority: "high",
          status: "fixed",
          title: "Markdown見出しの表示回帰",
          body: "PR作成者が修正済み。再レビューで通過。",
        },
      ],
      codexCommand:
        'npm run review:codex -- --base main --title "議事録テンプレート改善"',
    },
  ] satisfies PullRequestReview[],
  checklist: [
    "mainとの差分が1つの目的に閉じている",
    "PR本文にPM判断用の要約、検証、残リスクがある",
    "CodexレビューのCrucial / High PriorityがPR作成者により対応済み",
    "CI、型チェック、ビルドのいずれかで最低限の検証が通っている",
    "PMがリリース順序と依存PRを確認している",
  ],
};
