import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectFile } from "@/lib/types";
import { formatDateTime, safeFileUrl } from "@/lib/utils";
import { EmptyState } from "./_shared";

export function FilesSection({ files }: { files: ProjectFile[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" aria-hidden />
          <CardTitle>進捗に紐づくファイル</CardTitle>
        </div>
        <span className="text-xs text-[#81786d]">{files.length}件</span>
      </CardHeader>
      <CardContent className="space-y-0">
        {files.length === 0 && (
          <EmptyState
            title="ファイルはまだありません"
            description="詳細画面のファイルタブから確認できます。"
            icon={FileText}
          />
        )}
        {files.slice(0, 5).map((file) => {
          const safeUrl = safeFileUrl(file.url);
          const className =
            "grid grid-cols-1 gap-1 border-b border-dashed border-[#d8d1c4] py-2.5 text-sm transition last:border-b-0 hover:bg-[#fbfaf5] sm:grid-cols-[1fr_auto] sm:gap-3";
          const content = (
            <>
              <span className="truncate text-[#312d27]">{file.name}</span>
              <span className="text-xs text-[#81786d]">
                {formatDateTime(file.updatedAt)}
              </span>
            </>
          );

          if (!safeUrl) {
            return (
              <div
                key={file.id}
                className={`${className} text-[#9a4a31]`}
                title="無効なURLのためリンクを無効化しています"
              >
                {content}
              </div>
            );
          }

          return (
            <a
              key={file.id}
              href={safeUrl}
              target="_blank"
              rel="noreferrer noopener"
              className={className}
            >
              {content}
            </a>
          );
        })}
      </CardContent>
    </Card>
  );
}
