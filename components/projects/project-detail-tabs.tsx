"use client";

import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Circle,
  FileText,
  FolderOpen,
  Landmark,
  ListChecks,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PriorityBadge, ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getOpenTaskCount,
  getProjectBudgetBalance,
  getTaskCompletion,
} from "@/lib/project-selectors";
import type { Project } from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  safeFileUrl,
} from "@/lib/utils";

type TabKey = "overview" | "progress" | "minutes" | "finance" | "files";

const tabs: {
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

export function ProjectDetailTabs({
  project,
  initialTab,
}: {
  project: Project;
  initialTab?: string;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>(() =>
    getTabFromValue(initialTab),
  );
  const profit = getProjectBudgetBalance(project);
  const completion = useMemo(
    () => getTaskCompletion(project.tasks),
    [project.tasks],
  );
  const openTaskCount = getOpenTaskCount(project.tasks);
  const activeTabMeta = tabs.find((tab) => tab.key === activeTab)!;

  useEffect(() => {
    function syncTabFromUrl() {
      setActiveTab(getTabFromSearch());
    }

    syncTabFromUrl();
    window.addEventListener("popstate", syncTabFromUrl);

    return () => window.removeEventListener("popstate", syncTabFromUrl);
  }, []);

  function handleSelectTab(tabKey: TabKey) {
    if (tabKey === activeTab) {
      return;
    }

    setActiveTab(tabKey);

    const url = new URL(window.location.href);

    if (tabKey === "overview") {
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("tab", tabKey);
    }

    window.history.pushState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }

  function selectAndFocusTab(tabKey: TabKey) {
    handleSelectTab(tabKey);
    window.requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>(
        `[data-project-detail-tab="${tabKey}"]`,
      )?.focus();
    });
  }

  function handleTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    tabKey: TabKey,
  ) {
    const currentIndex = tabs.findIndex((tab) => tab.key === tabKey);
    const lastIndex = tabs.length - 1;
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = lastIndex;
    }

    if (nextIndex === null) {
      return;
    }

    event.preventDefault();
    selectAndFocusTab(tabs[nextIndex].key);
  }

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="進捗詳細のタブ"
        className="flex gap-1 overflow-x-auto rounded-lg border border-[#423c33]/55 bg-[#f3f0e7] p-1"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active}
              tabIndex={active ? 0 : -1}
              data-project-detail-tab={tab.key}
              onClick={() => handleSelectTab(tab.key)}
              onKeyDown={(event) => handleTabKeyDown(event, tab.key)}
              className={cn(
                "inline-flex h-10 min-w-[88px] shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-bold text-[#70675b] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c95d3a] sm:flex-1 sm:px-4",
                active && "bg-[#312d27] text-white shadow-sm",
                !active && "hover:bg-[#fffefa] hover:text-[#312d27]",
              )}
              type="button"
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-[#81786d]" aria-live="polite">
        現在表示中:{" "}
        <strong className="text-[#5f574d]">{activeTabMeta.label}</strong> -{" "}
        {activeTabMeta.description}
      </p>

      {activeTab === "overview" && (
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>進捗概要</CardTitle>
                <p className="mt-1 text-sm text-[#81786d]">
                  状態、進捗率、次の節目、担当者を確認します。
                </p>
              </div>
              <ProjectStatusBadge status={project.status} />
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-[#5f574d]">{project.summary}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoTile
                  icon={CalendarClock}
                  label="次の節目"
                  value={formatDate(project.dueDate)}
                />
                <InfoTile icon={UsersRound} label="担当者" value={project.owner} />
              </div>
              <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-[#312d27]">進捗率</span>
                  <span className="font-mono text-sm font-bold text-[#312d27]">
                    {project.progress}%
                  </span>
                </div>
                <Progress value={project.progress} className="h-3" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>進捗ログ</CardTitle>
              <span className="text-xs text-[#81786d]">
                {project.updates.length}件
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.updates.length === 0 ? (
                <EmptyState
                  title="更新履歴はありません"
                  description="進捗に動きがあるとここに記録されます。"
                />
              ) : (
                project.updates.map((update) => (
                  <div
                    key={update.id}
                    className="border-l-2 border-[#cf623d] bg-[#f8efe8] px-4 py-3"
                  >
                    <p className="font-mono text-xs font-bold text-[#9a4a31]">
                      {formatDateTime(update.date)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5f574d]">
                      {update.text}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "progress" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>進捗タスク</CardTitle>
              <p className="mt-1 text-sm text-[#81786d]">
                完了率 {completion}% ・ 未完了 {openTaskCount}件
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {project.tasks.length === 0 && (
              <EmptyState
                title="タスクはまだありません"
                description="このワークにはタスクが登録されていません。"
              />
            )}
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="grid gap-4 border-b border-dashed border-[#d8d1c4] px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  {task.completed ? (
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#5f8b5b]"
                      aria-label="完了"
                    />
                  ) : (
                    <Circle
                      className="mt-0.5 h-5 w-5 shrink-0 text-[#9a9084]"
                      aria-label="未完了"
                    />
                  )}
                  <div>
                    <p
                      className={cn(
                        "font-bold text-[#312d27]",
                        task.completed && "text-[#9a9084] line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#70675b]">
                      {task.note}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <PriorityBadge priority={task.priority} />
                  <Badge tone={task.completed ? "green" : "slate"}>
                    {task.completed ? "完了" : "未完了"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab === "minutes" && (
        <div className="space-y-4" id="minutes">
          {project.minutes.length === 0 && (
            <Card>
              <CardContent>
                <EmptyState
                  title="議事録はまだありません"
                  description="打ち合わせの記録はここに保存されます。"
                />
              </CardContent>
            </Card>
          )}
          {project.minutes.map((minute) => (
            <Card key={minute.id}>
              <CardHeader>
                <div>
                  <CardTitle>{minute.title}</CardTitle>
                  <p className="mt-1 text-sm text-[#81786d]">
                    {formatDateTime(minute.createdAt)} ・ 参加者{" "}
                    {minute.participants.join(" / ")}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <MarkdownLike body={minute.body} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "finance" && (
        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]" id="finance">
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <FinanceTile
              label="予算"
              value={formatCurrency(project.revenue)}
              tone="blue"
            />
            <FinanceTile
              label="消化"
              value={formatCurrency(project.cost)}
              tone="amber"
            />
            <FinanceTile
              label="余力"
              value={formatCurrency(profit)}
              tone={profit >= 0 ? "green" : "rose"}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>予算履歴</CardTitle>
              <span className="text-xs text-[#81786d]">
                {project.transactions.length}件
              </span>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {project.transactions.length === 0 ? (
                <EmptyState
                  title="予算履歴はまだありません"
                  description="予算や消化額を登録するとここに表示されます。"
                />
              ) : (
                <table className="w-full min-w-[620px]">
                  <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                    <tr>
                      <th scope="col" className="px-5 py-4">
                        日付
                      </th>
                      <th scope="col" className="px-5 py-4">
                        内容
                      </th>
                      <th scope="col" className="px-5 py-4">
                        種別
                      </th>
                      <th scope="col" className="px-5 py-4 text-right">
                        金額
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {project.transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="border-t border-[#ded6ca] px-5 py-4 text-sm text-[#70675b]">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="border-t border-[#ded6ca] px-5 py-4 font-bold text-[#312d27]">
                          {transaction.label}
                        </td>
                        <td className="border-t border-[#ded6ca] px-5 py-4">
                          <Badge
                            tone={
                              transaction.type === "revenue" ? "green" : "amber"
                            }
                          >
                            {transaction.type === "revenue" ? "予算" : "消化"}
                          </Badge>
                        </td>
                        <td className="border-t border-[#ded6ca] px-5 py-4 text-right font-bold text-[#312d27]">
                          {formatCurrency(transaction.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "files" && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Google Drive URL管理</CardTitle>
              <p className="mt-1 text-sm text-[#81786d]">
                進捗に紐づく外部URLを表示します。安全なURLだけ新しいタブで開けます。
              </p>
            </div>
            <span className="text-xs text-[#81786d]">{project.files.length}件</span>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {project.files.length === 0 && (
              <div className="md:col-span-2">
                <EmptyState
                  title="ファイルはまだありません"
                  description="このワークにはまだ外部ファイルが登録されていません。"
                />
              </div>
            )}
            {project.files.map((file) => {
              const safeUrl = safeFileUrl(file.url);
              const cardClass =
                "group rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4 transition hover:border-[#c95d3a] hover:bg-[#fffefa]";
              const inner = (
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge tone="blue">{file.type.toUpperCase()}</Badge>
                    <p className="mt-3 font-bold text-[#312d27]">{file.name}</p>
                    <p className="mt-1 text-sm text-[#70675b]">
                      更新日 {formatDateTime(file.updatedAt)}
                    </p>
                    {!safeUrl && (
                      <p className="mt-2 text-xs font-bold text-[#9a4a31]">
                        URL不正のためリンクを無効化しています
                      </p>
                    )}
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[#9a9084] transition group-hover:text-[#c95d3a]" />
                </div>
              );

              if (!safeUrl) {
                return (
                  <div key={file.id} className={cardClass}>
                    {inner}
                  </div>
                );
              }

              return (
                <a
                  key={file.id}
                  href={safeUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className={cardClass}
                  aria-label={`${file.name}を新しいタブで開く`}
                >
                  {inner}
                </a>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-md border border-[#d8d1c4] bg-[#fffefa] text-[#c95d3a]">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
        {label}
      </p>
      <p className="mt-1 font-bold text-[#312d27]">{value}</p>
    </div>
  );
}

function FinanceTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "amber" | "green" | "rose";
}) {
  const toneClass = {
    blue: "bg-[#eef4f8] border-[#a8bed4]",
    amber: "bg-[#fff3c8] border-[#d4bd7f]",
    green: "bg-[#edf5ea] border-[#a8c3a6]",
    rose: "bg-[#f8d8cb] border-[#e2ac98]",
  };

  return (
    <div className={cn("rounded-lg border p-4", toneClass[tone])}>
      <p className="text-sm font-bold text-[#70675b]">{label}</p>
      <p className="mt-3 text-2xl font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <p className="text-sm font-bold text-[#5f574d]">{title}</p>
      <p className="text-xs text-[#81786d]">{description}</p>
    </div>
  );
}

function MarkdownLike({ body }: { body: string }) {
  return (
    <div className="space-y-3 rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-5 text-sm leading-7 text-[#5f574d]">
      {body.split("\n").map((line, index) => {
        if (line.startsWith("## ")) {
          return (
            <h3 key={`${line}-${index}`} className="pt-1 font-black text-[#312d27]">
              {line.replace("## ", "")}
            </h3>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <p key={`${line}-${index}`} className="pl-4">
              <span className="mr-2 text-[#c95d3a]">•</span>
              {line.replace("- ", "")}
            </p>
          );
        }

        if (!line.trim()) {
          return <div key={`space-${index}`} className="h-1" />;
        }

        return <p key={`${line}-${index}`}>{line}</p>;
      })}
    </div>
  );
}

function getTabFromSearch(): TabKey {
  if (typeof window === "undefined") {
    return "overview";
  }

  const tab = new URLSearchParams(window.location.search).get("tab");

  return isTabKey(tab) ? tab : "overview";
}

function getTabFromValue(value: string | null | undefined): TabKey {
  return isTabKey(value) ? value : "overview";
}

function isTabKey(value: string | null | undefined): value is TabKey {
  return tabs.some((tab) => tab.key === value);
}
