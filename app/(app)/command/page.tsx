import {
  Bot,
  Check,
  ClipboardList,
  FileText,
  MessageSquare,
  Play,
  SquareTerminal,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCodeReviewSystem, getProjects } from "@/lib/clapboard-api";
import { buildAgentLog } from "@/lib/command-agent-log";
import {
  getAllProjectTasks,
  getCompletedTasks,
  getHighPriorityOpenTasks,
  getOpenTasks,
  getRecentlyUpdatedProjects,
} from "@/lib/project-selectors";
import { formatLogTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CommandPage() {
  const [projectsResult, reviewSystemResult] = await Promise.all([
    getProjects(),
    getCodeReviewSystem(),
  ]);

  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }
  if (reviewSystemResult.error) {
    throw new Error(reviewSystemResult.error.message);
  }

  const projects = projectsResult.data;
  const reviewSystem = reviewSystemResult.data;
  const allTasks = getAllProjectTasks(projects);
  const openTasks = getOpenTasks(allTasks);
  const blockerTasks = getHighPriorityOpenTasks(allTasks);
  const completedTasks = getCompletedTasks(allTasks);
  const recentProjects = getRecentlyUpdatedProjects(projects);
  const activePullRequests = reviewSystem.pullRequests.filter(
    (pullRequest) => pullRequest.reviewState !== "passed",
  );
  const agentLog = buildAgentLog({
    projects,
    recentProjects,
    reviewSystem,
    openTasks,
    blockerTasks,
    completedTasks,
    activePullRequests,
  });

  return (
    <div className="space-y-4">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
            COMMAND CENTER
          </p>
          <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
                AIエージェントへの指示と実行ログ
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6f665b]">
                タスク抽出、レビュー投入、レポート作成などの指示を、進捗データとPR状態を見ながら実行する画面です。
              </p>
            </div>
            <div className="flex shrink-0 overflow-hidden rounded-md border border-[#423c33]/55 text-sm font-bold">
              <span className="bg-[#312d27] px-3 py-2 text-white">Chat</span>
              <span className="px-3 py-2 text-[#70675b]">Plan</span>
              <span className="px-3 py-2 text-[#70675b]">History</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" aria-hidden />
              <CardTitle>Agent Status</CardTitle>
            </div>
            <Badge tone={activePullRequests.length > 0 ? "amber" : "green"}>
              {activePullRequests.length > 0 ? "reviewing" : "idle"}
            </Badge>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-2 text-center">
            <Metric label="未完了" value={`${openTasks.length}`} />
            <Metric label="停滞" value={`${blockerTasks.length}`} />
            <Metric label="PR確認" value={`${activePullRequests.length}`} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" aria-hidden />
              <CardTitle>指示スレッド</CardTitle>
            </div>
            <Badge tone={projectsResult.connected ? "green" : "amber"}>
              {projectsResult.connected ? "Backend API" : "Local API"}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {[
                "新着ブロッカーを抽出",
                "今日の報告を作成",
                "レビュー待ちPRを整理",
                "関連ファイルを確認",
              ].map((command) => (
                <button
                  key={command}
                  type="button"
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm font-bold text-[#5f574d]"
                >
                  <Play className="h-3.5 w-3.5" aria-hidden />
                  {command}
                </button>
              ))}
            </div>

            <div className="ml-auto max-w-2xl rounded-lg border border-[#d8d1c4] bg-[#f7f4ec] px-4 py-3 text-sm font-semibold leading-6 text-[#5f574d]">
              今日の高優先度タスクとレビュー待ちPRをまとめて、次に見る順番を出して。
            </div>

            <div className="max-w-3xl rounded-lg border border-[#e2ac98] bg-[#f8d8cb] px-4 py-3 text-sm leading-6 text-[#5f574d]">
              <p className="font-black text-[#9f452c]">
                {blockerTasks.length}件の停滞タスクと{activePullRequests.length}件のレビュー対象があります。
              </p>
              <ol className="mt-3 space-y-2">
                {blockerTasks.slice(0, 3).map((task, index) => (
                  <li key={`${task.projectId}-${task.id}`} className="flex gap-3">
                    <span className="font-mono text-xs font-black text-[#9f452c]">
                      {index + 1}
                    </span>
                    <span>
                      <Link
                        href={`/projects/${task.projectId}?tab=progress`}
                        className="font-bold underline"
                      >
                        {task.title}
                      </Link>
                      <span className="text-[#81786d]"> / {task.projectName}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">AIエージェントへの指示</span>
                  <input
                    className="h-11 w-full rounded-md border border-[#c8c0b4] bg-[#fbfaf5] px-3 text-sm outline-none placeholder:text-[#9a9084]"
                    placeholder="指示を入力... @file /tool"
                    readOnly
                  />
                </label>
                <ButtonLink href="/timeline" className="h-11 shrink-0">
                  実行計画を見る
                  <ClipboardList className="h-4 w-4" aria-hidden />
                </ButtonLink>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <SquareTerminal className="h-4 w-4" aria-hidden />
                <CardTitle>Agent Log</CardTitle>
              </div>
              <Badge tone="green">live</Badge>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-xs">
              {agentLog.map((entry) => (
                <div key={entry.name} className="grid grid-cols-[48px_1fr] gap-3">
                  <span className="text-[#81786d]">{formatLogTime(entry.time)}</span>
                  <span className="text-[#4f483f]">
                    {entry.name} - {entry.body}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4" aria-hidden />
                <CardTitle>Context</CardTitle>
              </div>
              <span className="text-xs text-[#81786d]">live pinned</span>
            </CardHeader>
            <CardContent className="space-y-3">
              {openTasks.slice(0, 4).map((task) => (
                <Link
                  key={`${task.projectId}-${task.id}`}
                  href={`/projects/${task.projectId}?tab=progress`}
                  className="grid grid-cols-[18px_1fr] gap-3 border-b border-dashed border-[#d8d1c4] pb-3 text-sm last:border-b-0 last:pb-0"
                >
                  <span className="mt-0.5 h-4 w-4 rounded-sm border border-[#777066] bg-[#fffefa]" />
                  <span>
                    <span className="font-bold text-[#312d27]">{task.title}</span>
                    <span className="block text-xs text-[#81786d]">
                      {task.projectName}
                    </span>
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" aria-hidden />
                <CardTitle>Review Queue</CardTitle>
              </div>
              <span className="text-xs text-[#81786d]">
                {reviewSystem.mainBranch} gate
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              {activePullRequests.map((pullRequest) => (
                <div
                  key={pullRequest.id}
                  className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3"
                >
                  <p className="text-sm font-black text-[#312d27]">
                    {pullRequest.title}
                  </p>
                  <p className="mt-1 text-xs text-[#81786d]">
                    {pullRequest.branch} - {pullRequest.changedFiles} files
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3">
      <p className="text-xs font-bold text-[#81786d]">{label}</p>
      <p className="mt-1 text-xl font-black tracking-normal text-[#312d27]">
        {value}
      </p>
    </div>
  );
}
