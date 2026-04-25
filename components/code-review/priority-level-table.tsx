import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { priorityMeta } from "@/lib/code-review-meta";
import type { ReviewPriorityLevel } from "@/lib/code-review-system";

export function PriorityLevelTable({
  levels,
}: {
  levels: ReviewPriorityLevel[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" aria-hidden />
          <CardTitle>レビュー返信プライオリティ</CardTitle>
        </div>
        <Badge tone="red">1-2は作成者必須</Badge>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px]">
          <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
            <tr>
              <th className="px-5 py-4">順位</th>
              <th className="px-5 py-4">優先度</th>
              <th className="px-5 py-4">対応者</th>
              <th className="px-5 py-4">マージ判断</th>
              <th className="px-5 py-4">基準</th>
            </tr>
          </thead>
          <tbody>
            {levels.map((level) => {
              const priority = priorityMeta[level.priority];
              return (
                <tr key={level.priority}>
                  <td className="border-t border-[#ded6ca] px-5 py-4 font-mono text-sm font-black text-[#312d27]">
                    {level.rank}
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4">
                    <Badge tone={priority.tone}>{level.label}</Badge>
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4 text-sm font-bold text-[#312d27]">
                    {level.owner}
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4 text-sm text-[#70675b]">
                    {level.mergeRule}
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4 text-sm leading-6 text-[#70675b]">
                    {level.body}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
