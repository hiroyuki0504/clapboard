import { GitBranch } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { branchStatusMeta, riskMeta } from "@/lib/code-review-meta";
import type { BranchWorkstream } from "@/lib/code-review-system";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateTime } from "@/lib/utils";

export function BranchTableCard({
  branches,
}: {
  branches: BranchWorkstream[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4" aria-hidden />
          <CardTitle>ブランチ分割ボード</CardTitle>
        </div>
        <span className="font-mono text-xs text-[#81786d]">base: main</span>
      </CardHeader>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full min-w-[900px]">
          <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
            <tr>
              <th className="px-5 py-4">作業</th>
              <th className="px-5 py-4">ブランチ</th>
              <th className="px-5 py-4">状態</th>
              <th className="px-5 py-4">PR</th>
              <th className="px-5 py-4">リスク</th>
              <th className="px-5 py-4">次アクション</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((branch) => {
              const status = branchStatusMeta[branch.status];
              const risk = riskMeta[branch.risk];
              return (
                <tr key={branch.id}>
                  <td className="border-t border-[#ded6ca] px-5 py-4">
                    <p className="font-bold text-[#312d27]">{branch.title}</p>
                    <p className="mt-1 text-xs text-[#81786d]">
                      {branch.owner} ・ 期限 {formatDateTime(branch.dueAt)}
                    </p>
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4 font-mono text-xs text-[#5f574d]">
                    {branch.branch}
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4">
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4 text-sm font-bold text-[#312d27]">
                    {branch.pullRequest}
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4">
                    <span className={cn("font-bold", risk.className)}>
                      {risk.label}
                    </span>
                  </td>
                  <td className="border-t border-[#ded6ca] px-5 py-4 text-sm leading-6 text-[#70675b]">
                    {branch.nextAction}
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
