"use client";

import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  FileText,
  ListTodo,
  MessageSquare,
  Network,
  SquareTerminal,
  TrendingUp,
  JapaneseYen,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { allFiles, projects } from "@/lib/mock-data";
import { readProjectsWithSnapshots } from "@/lib/project-persistence";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const [dashboardProjects, setDashboardProjects] = useState<DashboardProject[]>(
    projects,
  );

  useEffect(() => {
    setDashboardProjects(readProjectsWithSnapshots(projects) as DashboardProject[]);
  }, []);

  const activeProjects = dashboardProjects.filter(
    (project) => project.status !== "completed",
  );
  const monthlyProfit = dashboardProjects.reduce(
    (total, project) => total + project.revenue - project.cost,
    0,
  );
  const recentProjects = [...dashboardProjects].sort(
    (a, b) =>
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
  );
  const recentImports = dashboardProjects
    .flatMap((project) =>
      (project.imports ?? []).map((minuteImport) => ({
        ...minuteImport,
        id: minuteImport.id ?? `${project.id}-${minuteImport.createdAt ?? "import"}`,
        createdAt: minuteImport.createdAt ?? project.lastUpdated,
        filename: minuteImport.filename ?? "取り込み議事録",
        projectId: project.id,
        projectName: project.name,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const fallbackImports = dashboardProjects
    .flatMap((project) =>
      project.minutes.map((minute) => ({
        id: minute.id,
        filename: minute.title,
        createdAt: minute.createdAt,
        extractionStatus: project.status === "review" ? "extracted" : "reviewed",
        projectId: project.id,
        projectName: project.name,
      })),
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  const importFeed = recentImports.length > 0 ? recentImports : fallbackImports;
  const reviewPendingCount = dashboardProjects.reduce(
    (total, project) => total + getProjectReviewPendingCount(project),
    0,
  );
  const pendingReviews = dashboardProjects.flatMap((project) => {
    const reviewPendingCount = getProjectReviewPendingCount(project);

    if (reviewPendingCount === 0) {
      return [];
    }

    const latestImport = [...importFeed]
      .filter((minuteImport) => minuteImport.projectId === project.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];

    return [
      {
        id: `review-${project.id}`,
        title:
          latestImport != null
            ? `${latestImport.filename} のレビューを確定`
            : `${project.name} の抽出結果を確認`,
        detail:
          reviewPendingCount > 1
            ? `${reviewPendingCount}件の確認待ちがあります`
            : "抽出結果の確認が残っています",
        createdAt: latestImport?.createdAt ?? project.lastUpdated,
        projectId: project.id,
        projectName: project.name,
        priority: project.status === "review" ? "high" : "medium",
      },
    ];
  });
  const explicitUnresolvedCount = dashboardProjects.reduce(
    (total, project) => total + getExplicitUnresolvedItems(project).length,
    0,
  );
  const unresolvedAmbiguities = dashboardProjects.flatMap((project) =>
    getProjectUnresolvedItems(project, explicitUnresolvedCount === 0).map(
      (ambiguity) => ({
        ...ambiguity,
        id: `ambiguity-${ambiguity.id}`,
        projectId: project.id,
        projectName: project.name,
      }),
    ),
  );
  const unresolvedTaskIds = new Set(
    unresolvedAmbiguities.map((ambiguity) => ambiguity.id.replace(/^ambiguity-/, "")),
  );
  const focusProjects = recentProjects.filter((project) =>
    getProjectReviewPendingCount(project) > 0 ||
    getProjectUnresolvedItems(project, explicitUnresolvedCount === 0).length > 0,
  );
  const followUpTasks = dashboardProjects.flatMap((project) =>
    project.tasks
      .filter((task) => !task.completed)
      .filter((task) => !unresolvedTaskIds.has(task.id))
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        detail: task.note,
        createdAt: project.lastUpdated,
        projectId: project.id,
        projectName: project.name,
        priority: task.priority,
      })),
  );
  const reviewQueue = [...pendingReviews, ...unresolvedAmbiguities, ...followUpTasks]
    .sort((a, b) => {
      const priorityDiff = priorityRank[a.priority] - priorityRank[b.priority];

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    })
    .filter(
      (item, index, array) =>
        array.findIndex((candidate) => candidate.id === item.id) === index,
    );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            2026/04/25 SAT
          </p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                レビュー待ち {reviewPendingCount}件、未確定事項{" "}
                {unresolvedAmbiguities.length}件。今日はここから進める。
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                AIが取り込んだ議事録を起点に、確認待ちと保留論点を片付けて案件を前に進める運用OSです。
              </p>
            </div>
            <ButtonLink href="/projects" variant="secondary" className="shrink-0">
              案件一覧へ
              <ArrowRight className="h-4 w-4" aria-hidden />
            </ButtonLink>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-[0.9fr_0.9fr_1.2fr]">
            <div className="rounded-lg border border-[#d8d1c4] bg-[#fbfaf5] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#81786d]">
                  レビュー待ち
                </span>
                <Clock3 className="h-4 w-4 text-[#81786d]" aria-hidden />
              </div>
              <p className="mt-3 text-3xl font-black tracking-normal text-[#312d27]">
                {reviewPendingCount}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#70675b]">
                extractionStatus と pending suggestion を起点に集計
              </p>
            </div>
            <div className="rounded-lg border border-[#d8d1c4] bg-[#fbfaf5] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-[#81786d]">
                  未解消の未確定事項
                </span>
                <MessageSquare className="h-4 w-4 text-[#81786d]" aria-hidden />
              </div>
              <p className="mt-3 text-3xl font-black tracking-normal text-[#312d27]">
                {unresolvedAmbiguities.length}
              </p>
              <p className="mt-2 text-xs leading-5 text-[#70675b]">
                unresolved を優先。未整備時は保留タスクを補助的に反映
              </p>
            </div>
            <div className="rounded-lg border border-[#d8d1c4] bg-[#fbfaf5] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#81786d]" aria-hidden />
                  <p className="text-xs font-bold text-[#81786d]">
                    最近取り込まれた議事録
                  </p>
                </div>
                <span className="font-mono text-xs text-[#81786d]">
                  {recentImports.length > 0 ? "project.imports" : "minutes"}
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {importFeed.slice(0, 3).map((minuteImport) => (
                  <Link
                    key={minuteImport.id}
                    href={`/projects/${minuteImport.projectId}`}
                    className="block border-b border-dashed border-[#d8d1c4] pb-3 last:border-b-0 last:pb-0"
                  >
                    <p className="text-sm font-bold text-[#312d27]">
                      {minuteImport.filename}
                    </p>
                    <p className="mt-1 text-xs text-[#81786d]">
                      {minuteImport.projectName} ・{" "}
                      {formatDateTime(minuteImport.createdAt)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
          <StatPill
            label="レビュー待ち"
            value={`${reviewPendingCount}`}
            icon={Clock3}
          />
          <StatPill
            label="未確定事項"
            value={`${unresolvedAmbiguities.length}`}
            icon={MessageSquare}
          />
          <StatPill
            label="進行中案件"
            value={`${activeProjects.length}`}
            icon={TrendingUp}
          />
          <StatPill
            label="今月収支"
            value={formatCurrency(monthlyProfit)}
            icon={CircleDollarSign}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr_0.95fr]">
        <Card id="todo" className="xl:row-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" aria-hidden />
              <CardTitle>今日やること・レビュー起点</CardTitle>
              <Badge tone="red">{reviewQueue.slice(0, 6).length}</Badge>
            </div>
            <div className="flex overflow-hidden rounded-md border border-[#423c33]/55 text-xs font-semibold">
              <span className="bg-[#312d27] px-3 py-1.5 text-white">
                レビュー待ち
              </span>
              <span className="px-3 py-1.5 text-[#70675b]">未確定事項</span>
              <span className="px-3 py-1.5 text-[#70675b]">フォローアップ</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {reviewQueue.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/projects/${item.projectId}`}
                className="grid grid-cols-[24px_1fr_auto] items-start gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-4 transition hover:bg-[#fbfaf5] last:border-b-0"
              >
                <span
                  className={
                    item.priority === "high" && item.id.startsWith("review-")
                      ? "mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border border-[#c95d3a] bg-[#fbe4db]"
                      : item.id.startsWith("ambiguity-")
                        ? "mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border border-[#d2a528] bg-[#fff0a8]"
                        : "mt-0.5 flex h-4 w-4 items-center justify-center rounded-sm border border-[#777066] bg-[#fffefa]"
                  }
                >
                  <FileText className="h-3 w-3 text-[#70675b]" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#312d27]">
                    {item.title}
                  </p>
                  <p className="mt-1 font-mono text-xs text-[#8b8175]">
                    {item.projectName} ・ {formatDateTime(item.createdAt)}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#81786d]">
                    {item.detail}
                  </p>
                </div>
                <Badge
                  tone={
                    item.id.startsWith("review-")
                      ? "amber"
                      : item.id.startsWith("ambiguity-")
                        ? "red"
                        : item.priority === "high"
                          ? "red"
                          : item.priority === "medium"
                            ? "amber"
                            : "blue"
                  }
                >
                  {item.id.startsWith("review-")
                    ? "レビュー待ち"
                    : item.id.startsWith("ambiguity-")
                      ? "未確定"
                      : item.priority === "high"
                        ? "重要"
                        : item.priority === "medium"
                          ? "通常"
                          : "低"}
                </Badge>
              </Link>
            ))}
            <div className="p-4">
              <Link
                href="/projects"
                className="flex h-10 w-full items-center rounded-md border border-[#d8d1c4] bg-[#fffefa] px-4 text-sm text-[#9a9084]"
              >
                レビュー対象の案件を開く...
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden />
              <CardTitle>最新議事録・レビュー対象</CardTitle>
            </div>
            <span className="font-mono text-xs text-[#81786d]">
              {recentImports.length > 0 ? "imports" : "minutes"}
            </span>
          </CardHeader>
          <CardContent className="space-y-3">
            {importFeed.slice(0, 4).map((minuteImport) => (
              <Link
                key={minuteImport.id}
                href={`/projects/${minuteImport.projectId}`}
                className="block border-b border-dashed border-[#d8d1c4] pb-3 last:border-b-0 last:pb-0"
              >
                <p className="text-sm font-bold text-[#312d27]">
                  {minuteImport.filename}
                </p>
                <p className="mt-1 text-xs text-[#81786d]">
                  {minuteImport.projectName} ・{" "}
                  {formatDateTime(minuteImport.createdAt)}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card id="agent">
          <CardHeader>
            <div className="flex items-center gap-2">
              <SquareTerminal className="h-4 w-4" aria-hidden />
              <CardTitle>Review Agent Log</CardTitle>
            </div>
            <Badge tone="green">running</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 border-l-2 border-[#6e9a66] pl-3 font-mono text-xs leading-6 text-[#4f483f]">
              <p><span className="text-[#8b8175]">08:02</span> cw_scraper → 3 items</p>
              <p><span className="text-[#8b8175]">08:03</span> minute_import → queued</p>
              <p><span className="text-[#8b8175]">10:15</span> ai_extract → review-needed</p>
              <p><span className="text-[#8b8175]">10:16</span> ambiguity_flag → owner missing</p>
              <p><span className="text-[#8b8175]">11:32</span> review_apply → project updated</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>最近更新案件・レビュー優先</CardTitle>
            <span className="text-xs text-[#81786d]">review context</span>
          </CardHeader>
          <CardContent className="space-y-3">
            {(focusProjects.length > 0 ? focusProjects : recentProjects)
              .slice(0, 4)
              .map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3 transition hover:border-[#c95d3a]"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-[#312d27]">
                    {project.name}
                  </p>
                  <ProjectStatusBadge status={project.status} />
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={project.progress} className="h-2" />
                  <span className="font-mono text-xs font-bold text-[#70675b]">
                    {project.progress}%
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#81786d]">
                  レビュー待ち {getProjectReviewPendingCount(project)}件 ・
                  未確定事項{" "}
                  {
                    getProjectUnresolvedItems(
                      project,
                      explicitUnresolvedCount === 0,
                    ).length
                  }
                  件
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>

        <GraphCard />

        <FinanceCard profit={monthlyProfit} />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" aria-hidden />
              <CardTitle>最近のファイル</CardTitle>
            </div>
            <span className="text-xs text-[#81786d]">{allFiles.length}件</span>
          </CardHeader>
          <CardContent className="space-y-0">
            {allFiles.slice(0, 5).map((file) => (
              <a
                key={file.id}
                href={file.url}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[1fr_auto] gap-3 border-b border-dashed border-[#d8d1c4] py-2.5 text-sm last:border-b-0"
              >
                <span className="truncate text-[#312d27]">{file.name}</span>
                <span className="text-xs text-[#81786d]">
                  {formatDateTime(file.updatedAt)}
                </span>
              </a>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

type DashboardImport = {
  id?: string;
  filename?: string;
  createdAt?: string;
  extractionStatus?: DashboardExtractionStatus;
  suggestions?: DashboardSuggestion[];
};

type DashboardAmbiguity = {
  id: string;
  kind?: string;
  summary?: string;
  createdAt?: string;
  resolved?: boolean;
  status?: string;
};

type DashboardSuggestion = {
  id: string;
  status?: string;
  pending?: boolean;
  reviewed?: boolean;
};

type DashboardExtractionStatus =
  | string
  | {
      status?: string;
      pendingSuggestions?: number;
      reviewed?: boolean;
    };

type DashboardProject = (typeof projects)[number] & {
  imports?: DashboardImport[];
  ambiguities?: DashboardAmbiguity[];
  unresolved?: DashboardAmbiguity[];
  extractionStatus?: DashboardExtractionStatus;
  suggestions?: DashboardSuggestion[];
};

const priorityRank: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function getPendingSuggestionCount(project: DashboardProject) {
  const projectSuggestions = [
    ...(project.suggestions ?? []),
    ...(project.imports ?? []).flatMap((minuteImport) => minuteImport.suggestions ?? []),
  ];

  return projectSuggestions.filter((suggestion) => {
    const status = suggestion.status?.toLowerCase();
    const isPendingFlag =
      "pending" in suggestion && suggestion.pending === true;
    const isReviewedFlag =
      "reviewed" in suggestion && suggestion.reviewed === false;

    return (
      isPendingFlag ||
      isReviewedFlag ||
      status === "pending" ||
      status === "needs-review" ||
      status === "review"
    );
  }).length;
}

function isReviewPending(status?: DashboardExtractionStatus) {
  if (status == null) {
    return false;
  }

  if (typeof status === "string") {
    return ["pending", "extracted", "review-needed", "review"].includes(
      status.toLowerCase(),
    );
  }

  if (typeof status.pendingSuggestions === "number") {
    return status.pendingSuggestions > 0;
  }

  return (
    status.reviewed === false ||
    ["pending", "needs-review", "review"].includes(
      status.status?.toLowerCase() ?? "",
    )
  );
}

function getProjectReviewPendingCount(project: DashboardProject) {
  const pendingSuggestions = getPendingSuggestionCount(project);

  if (pendingSuggestions > 0) {
    return pendingSuggestions;
  }

  const importPendingCount = (project.imports ?? []).filter((minuteImport) =>
    isReviewPending(minuteImport.extractionStatus),
  ).length;

  if (importPendingCount > 0) {
    return importPendingCount;
  }

  if (isReviewPending(project.extractionStatus)) {
    return Math.max(project.minutes.length, 1);
  }

  if (project.status === "review") {
    return Math.max(project.minutes.length, 1);
  }

  return 0;
}

function getExplicitUnresolvedItems(project: DashboardProject) {
  return [...(project.unresolved ?? []), ...(project.ambiguities ?? [])]
    .filter((item) => {
      const status = item.status?.toLowerCase();

      return item.resolved !== true && status !== "resolved" && status !== "done";
    })
    .map((item) => ({
      id: item.id,
      title: item.kind != null ? ambiguityLabel(item.kind) : "未確定事項を確認",
      detail: item.summary ?? "内容確認待ち",
      createdAt: item.createdAt ?? project.lastUpdated,
      priority: "high" as const,
    }));
}

function getProjectUnresolvedItems(
  project: DashboardProject,
  allowFallback: boolean,
) {
  const explicitItems = getExplicitUnresolvedItems(project);

  if (explicitItems.length > 0 || !allowFallback) {
    return explicitItems;
  }

  const fallbackKeywords = [
    "確認",
    "未確定",
    "保留",
    "課題",
    "要件",
    "可否",
    "期限",
    "優先度",
    "担当者",
    "補完",
    "調整",
  ];

  return project.tasks
    .filter((task) => !task.completed)
    .filter((task) =>
      fallbackKeywords.some((keyword) =>
        `${task.title} ${task.note}`.includes(keyword),
      ),
    )
    .map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.note,
      createdAt: project.lastUpdated,
      priority: "high" as const,
    }));
}

function StatPill({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-3">
      <div className="mb-2 flex items-center justify-between text-[#81786d]">
        <span className="text-xs font-bold">{label}</span>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p className="truncate text-lg font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}

function ambiguityLabel(kind: string) {
  const labels: Record<string, string> = {
    "missing-assignee": "担当者なし",
    "missing-due-date": "期限なし",
    "unresolved-decision": "決定未確定",
    "unclear-dependency": "依存不明",
  };

  return labels[kind] ?? "未確定事項";
}

function GraphCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4" aria-hidden />
          <CardTitle>ファイル関係グラフ</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">最近7日</span>
      </CardHeader>
      <CardContent>
        <div className="dotted-canvas relative h-52 overflow-hidden rounded-md border border-[#d8d1c4] bg-[#fffefa]">
          <div className="absolute left-6 top-9 z-10 rounded-full border border-[#d66b43] bg-[#fffefa] px-3 py-1 text-xs font-bold text-[#9a4a31]">
            案件サマリ
          </div>
          <div className="absolute left-32 top-28 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            議事録
          </div>
          <div className="absolute right-8 top-20 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            LP_design
          </div>
          <div className="absolute left-48 top-14 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            spec.pdf
          </div>
          <span className="absolute left-[82px] top-[78px] h-px w-24 rotate-45 bg-[#c8c0b4]" />
          <span className="absolute left-[178px] top-[94px] h-px w-20 -rotate-45 bg-[#c8c0b4]" />
          <span className="absolute right-[82px] top-[82px] h-px w-24 rotate-[20deg] bg-[#c8c0b4]" />
          <div className="absolute bottom-5 left-7 rotate-[-2deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415] shadow-sm">
            ノード = 案件・議事録・ファイル
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FinanceCard({ profit }: { profit: number }) {
  const bars = [34, 48, 38, 58, 46, 67, 78, 92];

  return (
    <Card id="finance">
      <CardHeader>
        <div className="flex items-center gap-2">
          <JapaneseYen className="h-4 w-4" aria-hidden />
          <CardTitle>収支・4月</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">更新: 今</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#81786d]">粗利</p>
            <p className="mt-2 text-2xl font-black tracking-normal text-[#312d27]">
              {formatCurrency(profit)}
            </p>
          </div>
          <div className="text-right text-sm font-bold text-[#5f8b5b]">
            +18.2%
          </div>
        </div>
        <div className="mt-6 flex h-24 items-end gap-2">
          {bars.map((bar, index) => (
            <span
              key={bar}
              className={index > 5 ? "flex-1 rounded-t-sm bg-[#cf623d]" : "flex-1 rounded-t-sm bg-[#cfc5b4]"}
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-[#81786d]">今週の日報: 4/5投稿済み</p>
      </CardContent>
    </Card>
  );
}
