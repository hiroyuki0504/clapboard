import Link from "next/link";
import { ProjectStatusBadge } from "@/components/project-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  getProjectDashboardTab,
  projectDetailHref,
} from "@/lib/project-href";
import type { Project } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

export function RecentProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>進捗が動いたワーク</CardTitle>
        <span className="text-xs text-[#81786d]">last 7 days</span>
      </CardHeader>
      <CardContent className="space-y-3">
        {projects.slice(0, 4).map((project) => (
          <Link
            key={project.id}
            href={projectDetailHref(project.id, getProjectDashboardTab(project))}
            className="block rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-3 transition hover:border-[#c95d3a] hover:bg-[#fffefa]"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="truncate text-sm font-bold text-[#312d27]">
                {project.name}
              </p>
              <ProjectStatusBadge status={project.status} />
            </div>
            <div className="mb-2 flex items-center justify-between font-mono text-xs text-[#81786d]">
              <span>次の節目 {formatDate(project.dueDate)}</span>
              <span>{formatDateTime(project.lastUpdated)}</span>
            </div>
            <div className="flex items-center gap-3">
              <Progress value={project.progress} className="h-2" />
              <span className="font-mono text-xs font-bold text-[#70675b]">
                {project.progress}%
              </span>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
