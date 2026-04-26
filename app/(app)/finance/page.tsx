import { JapaneseYen, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/dashboard/_shared";
import { getProjects } from "@/lib/clapboard-api";
import { projectDetailHref } from "@/lib/project-href";
import { getProjectBudgetBalance } from "@/lib/project-selectors";
import type { Project } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function FinancePage() {
  const projectsResult = await getProjects();
  if (projectsResult.error) {
    throw new Error(projectsResult.error.message);
  }

  const projects = projectsResult.data;
  const totals = projects.reduce(
    (acc, project) => {
      acc.revenue += project.revenue;
      acc.cost += project.cost;
      return acc;
    },
    { revenue: 0, cost: 0 },
  );
  const profit = totals.revenue - totals.cost;
  const ranked = [...projects].sort(
    (a, b) => getProjectBudgetBalance(b) - getProjectBudgetBalance(a),
  );
  const profitable = ranked.filter(
    (project) => getProjectBudgetBalance(project) >= 0,
  ).length;
  const unprofitable = ranked.length - profitable;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#81786d]">
          MONTHLY FINANCE
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-normal text-[#2f2b25]">
          今月の収支
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6f665b]">
          ワークストリームごとの売上と支出を集計しています。プロジェクト名をクリックすると、明細を確認できます。
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <FinancePill
          label="売上合計"
          value={formatCurrency(totals.revenue)}
          icon={TrendingUp}
          tone="positive"
        />
        <FinancePill
          label="支出合計"
          value={formatCurrency(totals.cost)}
          icon={TrendingDown}
          tone="negative"
        />
        <FinancePill
          label="利益"
          value={formatCurrency(profit)}
          icon={JapaneseYen}
          tone={profit >= 0 ? "positive" : "negative"}
        />
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <JapaneseYen className="h-4 w-4" aria-hidden />
            <CardTitle>案件別の収支</CardTitle>
            <Badge tone="slate">{ranked.length}件</Badge>
          </div>
          <span className="font-mono text-xs text-[#81786d]">
            利益 {profitable}件 ・ 赤字 {unprofitable}件
          </span>
        </CardHeader>
        <CardContent className="space-y-0 p-0">
          {ranked.length === 0 ? (
            <EmptyState
              title="収支データがありません"
              description="案件を追加すると売上と支出が集計されます。"
              icon={JapaneseYen}
            />
          ) : (
            ranked.map((project) => (
              <ProjectFinanceRow key={project.id} project={project} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ProjectFinanceRow({ project }: { project: Project }) {
  const balance = getProjectBudgetBalance(project);
  const positive = balance >= 0;

  return (
    <Link
      href={projectDetailHref(project.id, "finance")}
      className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-dashed border-[#d8d1c4] px-4 py-3 transition last:border-b-0 hover:bg-[#fbfaf5]"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[#312d27]">
          {project.name}
        </p>
        <p className="mt-0.5 font-mono text-xs text-[#81786d]">
          売上 {formatCurrency(project.revenue)} ／ 支出{" "}
          {formatCurrency(project.cost)}
        </p>
      </div>
      <span
        className={
          positive
            ? "font-mono text-sm font-bold text-[#5f8b5b]"
            : "font-mono text-sm font-bold text-[#9a4a31]"
        }
      >
        {positive ? "+" : ""}
        {formatCurrency(balance)}
      </span>
    </Link>
  );
}

function FinancePill({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: "positive" | "negative";
}) {
  const valueClass =
    tone === "positive" ? "text-[#5f8b5b]" : "text-[#9a4a31]";
  return (
    <div className="rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-4">
      <div className="mb-2 flex items-center justify-between text-[#81786d]">
        <span className="text-xs font-bold">{label}</span>
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <p
        className={`truncate text-xl font-black tracking-normal ${valueClass}`}
      >
        {value}
      </p>
    </div>
  );
}
