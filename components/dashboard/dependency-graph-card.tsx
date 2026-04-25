import { Network } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHighPriorityOpenTaskCount } from "@/lib/project-selectors";
import type { Project } from "@/lib/types";

export function DependencyGraphCard({ projects }: { projects: Project[] }) {
  const focus = [...projects].sort(
    (a, b) =>
      getHighPriorityOpenTaskCount(b.tasks) -
      getHighPriorityOpenTaskCount(a.tasks),
  )[0];
  const focusLabel = focus
    ? `${focus.name.slice(0, 8)} ${focus.progress}%`
    : "進捗未取得";
  const blocker = focus?.tasks.find(
    (task) => !task.completed && task.priority === "high",
  );
  const minute = focus?.minutes[0];
  const file = focus?.files[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4" aria-hidden />
          <CardTitle>進捗依存グラフ</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">blocked path</span>
      </CardHeader>
      <CardContent>
        <div className="dotted-canvas relative h-52 overflow-hidden rounded-md border border-[#d8d1c4] bg-[#fffefa]">
          <div className="absolute left-6 top-9 z-10 rounded-full border border-[#d66b43] bg-[#fffefa] px-3 py-1 text-xs font-bold text-[#9a4a31]">
            {focusLabel}
          </div>
          <div className="absolute left-32 top-28 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            {blocker?.title.slice(0, 10) ?? "未完了タスク"}
          </div>
          <div className="absolute right-8 top-20 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            {file?.name.slice(0, 10) ?? "関連ファイル"}
          </div>
          <div className="absolute left-48 top-14 z-10 rounded-full border border-[#423c33] bg-[#fffefa] px-3 py-1 text-xs font-semibold">
            {minute?.title.slice(0, 10) ?? "進捗メモ"}
          </div>
          <span className="absolute left-[82px] top-[78px] h-px w-24 rotate-45 bg-[#c8c0b4]" />
          <span className="absolute left-[178px] top-[94px] h-px w-20 -rotate-45 bg-[#c8c0b4]" />
          <span className="absolute right-[82px] top-[82px] h-px w-24 rotate-[20deg] bg-[#c8c0b4]" />
          <div className="absolute bottom-5 left-7 rotate-[-2deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-3 py-2 text-xs font-bold leading-5 text-[#6f5415] shadow-sm">
            線 = 依存関係 / 赤枠 = 停滞ポイント
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
