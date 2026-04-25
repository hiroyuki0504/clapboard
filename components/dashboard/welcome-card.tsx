import { GitPullRequest, Sparkles } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function WelcomeCard() {
  return (
    <section className="rounded-lg border border-[#a8c3a6] bg-[#edf5ea] p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#5f8b5b] text-white">
            <Sparkles className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-[#2f4f2c]">
              ハッカソンデモはレビュー管制から開始
            </h3>
            <p className="mt-1.5 text-sm leading-6 text-[#3f5e3d]">
              AIエージェントへの依頼、Webワークツリー、プレビュー、
              PRレビュー、PM判断を1本の流れで見せます。
            </p>
          </div>
        </div>
        <ButtonLink href="/code-review" className="shrink-0">
          レビュー管制を開く
          <GitPullRequest className="h-4 w-4" aria-hidden />
        </ButtonLink>
      </div>
    </section>
  );
}
