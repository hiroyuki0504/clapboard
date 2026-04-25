import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectFile } from "@/lib/types";
import { formatDateTime, safeFileUrl } from "@/lib/utils";
import { EmptyState } from "./_shared";

export function FilesTab({ files }: { files: ProjectFile[] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Google Drive URL管理</CardTitle>
          <p className="mt-1 text-sm text-[#81786d]">
            進捗に紐づく外部URLを表示します。安全なURLだけ新しいタブで開けます。
          </p>
        </div>
        <span className="text-xs text-[#81786d]">{files.length}件</span>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {files.length === 0 && (
          <div className="md:col-span-2">
            <EmptyState
              title="ファイルはまだありません"
              description="このワークにはまだ外部ファイルが登録されていません。"
            />
          </div>
        )}
        {files.map((file) => {
          const safeUrl = safeFileUrl(file.url);
          const cardClass =
            "group rounded-md border border-[#d8d1c4] bg-[#fbfaf5] p-4 transition hover:border-[#c95d3a] hover:bg-[#fffefa]";
          const inner = (
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge tone="blue">{file.type.toUpperCase()}</Badge>
                <p className="mt-3 font-bold text-[#312d27]">{file.name}</p>
                <p className="mt-1 text-sm text-[#70675b]">
                  更新日 {formatDateTime(file.updatedAt)}
                </p>
                {!safeUrl && (
                  <p className="mt-2 text-xs font-bold text-[#9a4a31]">
                    URL不正のためリンクを無効化しています
                  </p>
                )}
              </div>
              <ArrowUpRight className="h-5 w-5 text-[#9a9084] transition group-hover:text-[#c95d3a]" />
            </div>
          );

          if (!safeUrl) {
            return (
              <div key={file.id} className={cardClass}>
                {inner}
              </div>
            );
          }

          return (
            <a
              key={file.id}
              href={safeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={cardClass}
              aria-label={`${file.name}を新しいタブで開く`}
            >
              {inner}
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
