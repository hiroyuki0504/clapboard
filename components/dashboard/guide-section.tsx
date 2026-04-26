import { HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function GuideStep({
  num,
  title,
  body,
}: {
  num: number;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5f8b5b] text-xs font-black text-white">
        {num}
      </span>
      <div>
        <p className="text-sm font-bold text-[#312d27]">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-[#70675b]">{body}</p>
      </div>
    </li>
  );
}

export function GuideSection() {
  return (
    <Card id="guide">
      <CardHeader>
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#5f8b5b]" aria-hidden />
          <CardTitle>使い方ガイド</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm leading-6 text-[#5f574d]">
          <GuideStep
            num={1}
            title="ダッシュボードで全体を確認"
            body="今日の次アクション、ブロッカー、直近の更新を最初に見ます。"
          />
          <GuideStep
            num={2}
            title="進捗ボードから詳細へ"
            body="ワークストリーム名や「開く」ボタンを押すと、タスク・メモ・予算・ファイルを確認できます。"
          />
          <GuideStep
            num={3}
            title="左サイドバーでファイルを確認"
            body="案件、ナレッジ、収支などの作業ファイルを名前で絞り込みながら確認します。"
          />
        </ol>
      </CardContent>
    </Card>
  );
}
