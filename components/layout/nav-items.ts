import {
  Check,
  Folder,
  HelpCircle,
  JapaneseYen,
  LayoutDashboard,
  Network,
  SquareTerminal,
  TimerReset,
} from "lucide-react";

export function isNavItemActive(
  item: { href: string },
  pathname: string,
  hash: string,
) {
  const baseHref = item.href.split("#")[0];
  const itemHash = item.href.includes("#")
    ? `#${item.href.split("#")[1]}`
    : "";

  if (item.href === "/dashboard") {
    return pathname === "/dashboard" && hash === "";
  }

  if (itemHash) {
    return pathname === baseHref && hash === itemHash;
  }

  return (
    baseHref !== "" &&
    (pathname === baseHref || pathname.startsWith(`${baseHref}/`))
  );
}

export type NavItem = {
  label: string;
  shortLabel: string;
  description: string;
  href: string;
  icon: React.ElementType;
};

export const railItems: NavItem[] = [
  {
    label: "ダッシュボード",
    shortLabel: "ホーム",
    description: "全体の状況を確認",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "案件一覧",
    shortLabel: "案件",
    description: "すべての案件",
    href: "/projects",
    icon: Folder,
  },
  {
    label: "グラフ",
    shortLabel: "グラフ",
    description: "関係性を可視化",
    href: "/graph",
    icon: Network,
  },
  {
    label: "コマンド",
    shortLabel: "コマンド",
    description: "AI実行ログと指示",
    href: "/command",
    icon: SquareTerminal,
  },
  {
    label: "タイムライン",
    shortLabel: "タイム",
    description: "予定と実行履歴",
    href: "/timeline",
    icon: TimerReset,
  },
  {
    label: "今日のタスク",
    shortLabel: "今日",
    description: "未処理タスク",
    href: "/tasks",
    icon: Check,
  },
  {
    label: "今月の収支",
    shortLabel: "収支",
    description: "売上と支出",
    href: "/finance",
    icon: JapaneseYen,
  },
  {
    label: "使い方ガイド",
    shortLabel: "ガイド",
    description: "基本の使い方",
    href: "/guide",
    icon: HelpCircle,
  },
];
