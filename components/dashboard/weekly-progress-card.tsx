import { TimerReset } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WeeklyProgressCard({
  averageProgress,
  completedCount,
  blockerCount,
  milestoneCount,
}: {
  averageProgress: number;
  completedCount: number;
  blockerCount: number;
  milestoneCount: number;
}) {
  const start = Math.max(0, averageProgress - 9);
  const delta = averageProgress - start;
  const bars = Array.from({ length: 8 }, (_, index) => {
    const ratio = index / 7;
    const value = Math.round(start + delta * ratio);
    return Math.max(8, Math.min(100, value));
  });

  return (
    <Card id="timeline">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TimerReset className="h-4 w-4" aria-hidden />
          <CardTitle>今週の進捗推移（イメージ）</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">サンプル / 実日次データ未接続</span>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#81786d]">平均進捗（現在値）</p>
            <p className="mt-2 text-2xl font-black tracking-normal text-[#312d27]">
              {start}% - {averageProgress}%
            </p>
          </div>
          <div className="text-right text-sm font-bold text-[#5f8b5b]">
            {delta >= 0 ? "+" : ""}
            {delta}pt
          </div>
        </div>
        <div className="mt-6 flex h-24 items-end gap-2">
          {bars.map((bar, index) => (
            <span
              key={`bar-${index}`}
              className={
                index > 5
                  ? "flex-1 rounded-t-sm bg-[#cf623d]"
                  : "flex-1 rounded-t-sm bg-[#cfc5b4]"
              }
              style={{ height: `${bar}%` }}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-[#81786d]">
          今週: 完了 {completedCount}件 / ブロッカー {blockerCount}件 / 節目{" "}
          {milestoneCount}件
        </p>
      </CardContent>
    </Card>
  );
}
