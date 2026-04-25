import { AlertTriangle, CalendarCheck, Gauge, GitBranch } from "lucide-react";
import { StatPill } from "./_shared";

export function StatPills({
  activeCount,
  averageProgress,
  completedCount,
  blockerCount,
}: {
  activeCount: number;
  averageProgress: number;
  completedCount: number;
  blockerCount: number;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2">
      <StatPill label="進行中" value={`${activeCount}`} icon={GitBranch} />
      <StatPill label="平均進捗" value={`${averageProgress}%`} icon={Gauge} />
      <StatPill
        label="完了タスク"
        value={`${completedCount}`}
        icon={CalendarCheck}
      />
      <StatPill label="ブロッカー" value={`${blockerCount}`} icon={AlertTriangle} />
    </div>
  );
}
