import {
  FileText,
  FolderOpen,
  Landmark,
  ListChecks,
  UsersRound,
} from "lucide-react";

export type TabKey =
  | "overview"
  | "review"
  | "progress"
  | "minutes"
  | "finance"
  | "files";

export const tabs: {
  key: TabKey;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    key: "overview",
    label: "概要",
    description: "状態・進捗・次の節目・担当者の確認",
    icon: FileText,
  },
  {
    key: "review",
    label: "レビュー",
    description: "議事録から抽出した候補の確認と一括処理",
    icon: ListChecks,
  },
  {
    key: "progress",
    label: "タスク",
    description: "未完了タスクと完了タスクの一覧",
    icon: ListChecks,
  },
  {
    key: "minutes",
    label: "議事録",
    description: "打ち合わせや進捗メモの記録",
    icon: UsersRound,
  },
  {
    key: "finance",
    label: "予算",
    description: "予算・消化・余力と履歴",
    icon: Landmark,
  },
  {
    key: "files",
    label: "ファイル",
    description: "Google Drive など外部ファイルのリンク",
    icon: FolderOpen,
  },
];

export function isTabKey(value: string | null | undefined): value is TabKey {
  return tabs.some((tab) => tab.key === value);
}

export function getTabFromValue(value: string | null | undefined): TabKey {
  return isTabKey(value) ? value : "overview";
}

export function getTabFromSearch(): TabKey {
  if (typeof window === "undefined") {
    return "overview";
  }

  const tab = new URLSearchParams(window.location.search).get("tab");

  return isTabKey(tab) ? tab : "overview";
}
