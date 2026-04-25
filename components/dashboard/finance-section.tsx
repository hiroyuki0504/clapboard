import { JapaneseYen } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailHref } from "@/lib/project-href";
import { getProjectBudgetBalance } from "@/lib/project-selectors";
import type { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { EmptyState } from "./_shared";

export function FinanceSection({ projects }: { projects: Project[] }) {
  const totals = projects.reduce(
    (acc, project) => {
      acc.revenue += project.revenue;
      acc.cost += project.cost;
      return acc;
    },
    { revenue: 0, cost: 0 },
  );
  const profit = totals.revenue - totals.cost;
  const ranked = [...projects].sort((a, b) => getProjectBudgetBalance(b) - getProjectBudgetBalance(a));

  return (
    <Card id="finance">
      <CardHeader>
        <div className="flex items-center gap-2">
          <JapaneseYen className="h-4 w-4" aria-hidden />
          <CardTitle>今月の収支</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">{projects.length}件</span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <FinancePill label="売上合計" value={formatCurrency(totals.revenue)} />
          <FinancePill label="支出合計" value={formatCurrency(totals.cost)} />
          <FinancePill
            label="利益"
            value={formatCurrency(profit)}
            tone={profit >= 0 ? "positive" : "negative"}
          />
        </div>
        {ranked.length === 0 ? (
          <EmptyState
            title="収支データがありません"
            description="案件を追加すると売上と支出が集計されます。"
            icon={JapaneseYen}
          />
        ) : (
          <ul className="space-y-0">
            {ranked.slice(0, 4).map((project) => {
              const projectProfit = getProjectBudgetBalance(project);
              return (
                <li key={project.id}>
                  <Link
                    href={projectDetailHref(project.id, "finance")}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-dashed border-[#d8d1c4] py-2.5 text-sm transition last:border-b-0 hover:bg-[#fbfaf5]"
                  >
                    <span className="truncate text-[#312d27]">
                      {project.name}
                    </span>
                    <span
                      className={
                        projectProfit >= 0
                          ? "font-mono text-xs font-bold text-[#5f8b5b]"
                          : "font-mono text-xs font-bold text-[#9a4a31]"
                      }
                    >
                      {projectProfit >= 0 ? "+" : ""}
                      {formatCurrency(projectProfit)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function FinancePill({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  const valueClass =
    tone === "positive"
      ? "text-[#5f8b5b]"
      : tone === "negative"
        ? "text-[#9a4a31]"
        : "text-[#312d27]";
  return (
    <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-3">
      <p className="text-xs font-bold text-[#81786d]">{label}</p>
      <p
        className={`mt-1 truncate text-base font-black tracking-normal ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}
