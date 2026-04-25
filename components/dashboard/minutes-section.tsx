import { MessageSquare } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { projectDetailHref } from "@/lib/project-href";
import type { ProjectMinute } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { EmptyState } from "./_shared";

type DashboardMinute = ProjectMinute & { projectId: string; projectName: string };

export function MinutesSection({ minutes }: { minutes: DashboardMinute[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" aria-hidden />
          <CardTitle>最新の進捗メモ</CardTitle>
        </div>
        <span className="font-mono text-xs text-[#81786d]">updates</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {minutes.length === 0 && (
          <EmptyState
            title="進捗メモはまだありません"
            description="ワークストリームの詳細画面に記録されます。"
            icon={MessageSquare}
          />
        )}
        {minutes.slice(0, 4).map((minute) => (
          <Link
            key={minute.id}
            href={projectDetailHref(minute.projectId, "minutes")}
            className="block border-b border-dashed border-[#d8d1c4] pb-3 transition last:border-b-0 last:pb-0 hover:bg-[#fbfaf5] hover:px-2"
          >
            <p className="text-sm font-bold text-[#312d27]">{minute.title}</p>
            <p className="mt-1 text-xs text-[#81786d]">
              {minute.projectName} ・ {formatDateTime(minute.createdAt)}
            </p>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
