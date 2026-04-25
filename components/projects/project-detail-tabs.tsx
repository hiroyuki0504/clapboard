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
import { useMemo, useState } from "react";
import { PriorityBadge, ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/types";
import {
  cn,
  formatCurrency,
  formatDate,
  formatDateTime,
  safeFileUrl,
} from "@/lib/utils";

type TabKey = "overview" | "progress" | "minutes" | "finance" | "files";

const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: FileText },
  { key: "progress", label: "Progress", icon: ListChecks },
  { key: "minutes", label: "Minutes", icon: UsersRound },
  { key: "finance", label: "Budget", icon: Landmark },
  { key: "files", label: "Files", icon: FolderOpen },
];

export function ProjectDetailTabs({ project }: { project: Project }) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const profit = project.revenue - project.cost;
  const completion = useMemo(() => {
    if (project.tasks.length === 0) {
      return 0;
    }
    const completed = project.tasks.filter((task) => task.completed).length;
    return Math.round((completed / project.tasks.length) * 100);
  }, [project.tasks]);

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-[#423c33]/55 bg-[#f3f0e7] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold text-[#70675b] transition",
                active && "bg-[#312d27] text-white shadow-sm",
                !active && "hover:bg-[#fffefa] hover:text-[#312d27]",
              )}
              type="button"
            >
              <Icon className="h-4 w-4" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

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
              <span className="text-xs text-[#81786d]">live</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {project.updates.map((update) => (
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
              ))}
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
                完了率 {completion}% ・ 未完了{" "}
                {project.tasks.filter((task) => !task.completed).length}件
              </p>
            </div>
            <Button variant="secondary">タスク追加</Button>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {project.tasks.map((task) => (
              <div
                key={task.id}
                className="grid gap-4 border-b border-dashed border-[#d8d1c4] px-4 py-4 last:border-b-0 sm:grid-cols-[1fr_auto]"
              >
                <div className="flex gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#5f8b5b]" />
                  ) : (
                    <Circle className="mt-0.5 h-5 w-5 shrink-0 text-[#9a9084]" />
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
                <Button variant="secondary">編集</Button>
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
            <FinanceTile label="予算" value={formatCurrency(project.revenue)} tone="blue" />
            <FinanceTile label="消化" value={formatCurrency(project.cost)} tone="amber" />
            <FinanceTile label="余力" value={formatCurrency(profit)} tone="green" />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>予算メモ</CardTitle>
              <Button variant="secondary">メモ追加</Button>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <table className="w-full min-w-[620px]">
                <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                  <tr>
                    <th className="px-5 py-4">日付</th>
                    <th className="px-5 py-4">内容</th>
                    <th className="px-5 py-4">種別</th>
                    <th className="px-5 py-4 text-right">金額</th>
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
                        <Badge tone={transaction.type === "revenue" ? "green" : "amber"}>
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
                MVPでは進捗に紐づく外部URLの表示と整理に絞っています。
              </p>
            </div>
            <Button variant="secondary">URL追加</Button>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {project.files.map((file) => {
              const safeUrl = safeFileUrl(file.url);
              const cardClass =
                "group rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4 transition hover:border-[#c95d3a]";
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
  tone: "blue" | "amber" | "green";
}) {
  const toneClass = {
    blue: "bg-[#eef4f8] border-[#a8bed4]",
    amber: "bg-[#fff3c8] border-[#d4bd7f]",
    green: "bg-[#edf5ea] border-[#a8c3a6]",
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
