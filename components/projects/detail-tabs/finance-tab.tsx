import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Project } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { EmptyState, FinanceTile } from "./_shared";

export function FinanceTab({
  project,
  profit,
}: {
  project: Pick<Project, "revenue" | "cost" | "transactions">;
  profit: number;
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]" id="finance">
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
        <FinanceTile label="予算" value={formatCurrency(project.revenue)} tone="blue" />
        <FinanceTile label="消化" value={formatCurrency(project.cost)} tone="amber" />
        <FinanceTile
          label="余力"
          value={formatCurrency(profit)}
          tone={profit >= 0 ? "green" : "rose"}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>予算履歴</CardTitle>
          <span className="text-xs text-[#81786d]">
            {project.transactions.length}件
          </span>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {project.transactions.length === 0 ? (
            <EmptyState
              title="予算履歴はまだありません"
              description="予算や消化額を登録するとここに表示されます。"
            />
          ) : (
            <table className="w-full min-w-[620px]">
              <thead className="bg-[#f3f0e7] text-left text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    日付
                  </th>
                  <th scope="col" className="px-5 py-4">
                    内容
                  </th>
                  <th scope="col" className="px-5 py-4">
                    種別
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    金額
                  </th>
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
                      <Badge
                        tone={transaction.type === "revenue" ? "green" : "amber"}
                      >
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
