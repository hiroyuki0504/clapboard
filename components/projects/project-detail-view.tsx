"use client";

import { ArrowLeft, Bot, CalendarDays, CircleDollarSign } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { ProjectDetailTabs } from "@/components/projects/project-detail-tabs";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  createProjectSnapshotData,
  mergeProjectWithSnapshot,
  readProjectSnapshot,
  writeProjectSnapshot,
} from "@/lib/project-persistence";
import { getProjectProfit } from "@/lib/project-selectors";
import type { Project, ProjectSnapshotData } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";

export function ProjectDetailView({ project }: { project: Project }) {
  const [projectState, setProjectState] = useState<ProjectSnapshotData>(() =>
    createProjectSnapshotData(project),
  );
  const [isPersistenceReady, setIsPersistenceReady] = useState(false);

  useEffect(() => {
    const hydratedProject = mergeProjectWithSnapshot(
      project,
      readProjectSnapshot(project.id),
    );

    setProjectState(createProjectSnapshotData(hydratedProject));
    setIsPersistenceReady(true);
  }, [project]);

  useEffect(() => {
    if (!isPersistenceReady) {
      return;
    }

    writeProjectSnapshot(project.id, projectState);
  }, [isPersistenceReady, project.id, projectState]);

  const hydratedProject = {
    ...project,
    ...projectState,
  };
  const profit = getProjectProfit(hydratedProject);

  return (
    <div className="space-y-4">
      <Link
        href="/projects"
        className="inline-flex items-center gap-2 text-sm font-bold text-[#70675b] transition hover:text-[#312d27]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        案件一覧へ戻る
      </Link>

      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <Card className="overflow-hidden">
          <div className="border-b border-[#d8d1c4] bg-[#fffefa] px-5 py-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <ProjectStatusBadge status={hydratedProject.status} />
              <span className="text-sm font-semibold text-[#70675b]">
                {hydratedProject.client}
              </span>
            </div>
            <h2 className="text-2xl font-black tracking-normal text-[#2f2b25] sm:text-3xl">
              {hydratedProject.name}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5f574d]">
              {hydratedProject.summary}
            </p>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <SummaryItem
              label="進捗率"
              value={`${hydratedProject.progress}%`}
              body={<Progress value={hydratedProject.progress} className="mt-3" />}
            />
            <SummaryItem
              label="期限"
              value={formatDate(hydratedProject.dueDate)}
              body={
                <div className="mt-3 flex items-center gap-2 text-sm text-[#70675b]">
                  <CalendarDays className="h-4 w-4" aria-hidden />
                  最終更新 {formatDate(hydratedProject.lastUpdated)}
                </div>
              }
            />
            <SummaryItem
              label="収支"
              value={formatCurrency(profit)}
              body={
                <div className="mt-3 flex items-center gap-2 text-sm text-[#5f8b5b]">
                  <CircleDollarSign className="h-4 w-4" aria-hidden />
                  売上 {formatCurrency(hydratedProject.revenue)}
                </div>
              }
            />
          </div>
        </Card>

        <Card className="bg-[#221d38] p-5 text-white">
          <div className="flex items-center gap-2 text-sm font-bold text-[#a9d2a4]">
            <Bot className="h-4 w-4" aria-hidden />
            OpenClaw Link
          </div>
          <h3 className="mt-3 text-xl font-black tracking-normal">
            AI補助の接続準備
          </h3>
          <p className="mt-3 text-sm leading-6 text-[#d8d0c6]">
            議事録整理、進捗更新、Google Driveファイル分類を同じ案件IDに紐付けられる想定です。
          </p>
          <div className="mt-5 rounded-md border border-white/15 bg-white/8 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#bdb5ad]">
              Agent Status
            </p>
            <p className="mt-2 text-sm font-bold">Standby / Mock Mode</p>
          </div>
          <div className="mt-4 rounded-sm border border-[#d2a528] bg-[#ffe783] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415]">
            次フェーズで実行ログ、チャット指示、Drive整理ジョブを接続予定。
          </div>
        </Card>
      </section>

      <ProjectDetailTabs
        project={hydratedProject}
        isHydrated={isPersistenceReady}
        onProjectChange={setProjectState}
      />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  body,
}: {
  label: string;
  value: string;
  body: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black tracking-normal text-[#312d27]">
        {value}
      </p>
      {body}
    </div>
  );
}
