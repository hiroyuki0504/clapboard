import { Sparkles } from "lucide-react";
import Link from "next/link";

export function WelcomeCard() {
  return (
    <section className="rounded-lg border border-[#a8c3a6] bg-[#edf5ea] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5f8b5b] text-white">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-black text-[#2f4f2c]">
            ようこそ ClawBoard へ
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-[#3f5e3d]">
            AIエージェントの依頼、Webワークツリー、PRレビュー、案件進捗をブラウザで確認できます。
            実装依頼や統合判断は「
            <Link href="/code-review" className="font-bold underline">
              レビュー管制
            </Link>
            」から進めます。
          </p>
        </div>
      </div>
    </section>
  );
}
