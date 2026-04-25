import { CalendarClock, UsersRound } from "lucide-react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { EmptyState, InfoTile } from "./_shared";

export function OverviewTab({ project }: { project: Project }) {
  return (
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
          <span className="text-xs text-[#81786d]">{project.updates.length}件</span>
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
  );
}
