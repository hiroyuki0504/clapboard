import { Badge, type BadgeShape } from "@/components/ui/badge";
import type { ProjectStatus, TaskPriority } from "@/lib/types";

export const statusMeta: Record<
  ProjectStatus,
  { label: string; tone: "blue" | "green" | "amber" | "red" | "slate" | "purple" }
> = {
  planning: { label: "計画中", tone: "purple" },
  "in-progress": { label: "進行中", tone: "blue" },
  review: { label: "レビュー", tone: "amber" },
  "at-risk": { label: "要注意", tone: "red" },
  completed: { label: "完了", tone: "green" },
};

export const priorityMeta: Record<
  TaskPriority,
  { label: string; tone: "blue" | "amber" | "red" }
> = {
  high: { label: "高", tone: "red" },
  medium: { label: "中", tone: "amber" },
  low: { label: "低", tone: "blue" },
};

function splitEveryTwoChars(label: string): string[] {
  return Array.from(label.match(/.{1,2}/gu) ?? [label]);
}

export function ProjectStatusBadge({
  status,
  shape = "default",
}: {
  status: ProjectStatus;
  shape?: BadgeShape;
}) {
  const meta = statusMeta[status];
  if (shape === "vertical") {
    return (
      <Badge tone={meta.tone} shape="vertical">
        <span className="sr-only">{meta.label}</span>
        {splitEveryTwoChars(meta.label).map((line, index) => (
          <span key={index} className="block" aria-hidden>
            {line}
          </span>
        ))}
      </Badge>
    );
  }
  return (
    <Badge tone={meta.tone} shape={shape}>
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const meta = priorityMeta[priority];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
