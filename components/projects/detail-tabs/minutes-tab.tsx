import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectMinute } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { EmptyStateCard, MarkdownLike } from "./_shared";

export function MinutesTab({ minutes }: { minutes: ProjectMinute[] }) {
  if (minutes.length === 0) {
    return (
      <div className="space-y-4" id="minutes">
        <EmptyStateCard
          title="議事録はまだありません"
          description="打ち合わせの記録はここに保存されます。"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4" id="minutes">
      {minutes.map((minute) => (
        <Card key={minute.id}>
          <CardHeader>
            <div>
              <CardTitle>{minute.title}</CardTitle>
              <p className="mt-1 text-sm text-[#81786d]">
                {formatDateTime(minute.createdAt)} ・ 参加者{" "}
                {minute.participants.join(" / ")}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <MarkdownLike body={minute.body} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
