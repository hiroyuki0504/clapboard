"use client";

import {
  GitBranch,
  GitPullRequest,
  MonitorUp,
  PlayCircle,
  SendHorizontal,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DEFAULT_PROMPT =
  "トップページのファーストビューでCTAが弱いので、文言を強くしてモバイル表示も確認してPR候補まで作って。";

const demoSteps = [
  {
    label: "依頼受付",
    body: "自然言語の依頼を1つの作業単位に切ります。",
    icon: SendHorizontal,
  },
  {
    label: "Webワークツリー",
    body: "codex/demo-cta-polish ブランチとして作業状態を表示します。",
    icon: GitBranch,
  },
  {
    label: "プレビュー",
    body: "PMがブラウザで差分と見た目を確認できる状態にします。",
    icon: MonitorUp,
  },
  {
    label: "PR候補",
    body: "検証結果、残リスク、PM判断ポイントをPR下書きにまとめます。",
    icon: GitPullRequest,
  },
];

export function HackathonIntakeDemo() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [submittedPrompt, setSubmittedPrompt] = useState(DEFAULT_PROMPT);
  const [hasSubmitted, setHasSubmitted] = useState(true);

  const branchName = submittedPrompt.toLowerCase().includes("cta")
    ? "codex/demo-cta-polish"
    : "codex/hackathon-demo-request";

  const handleSubmit = () => {
    const nextPrompt = prompt.trim() || DEFAULT_PROMPT;
    setPrompt(nextPrompt);
    setSubmittedPrompt(nextPrompt);
    setHasSubmitted(true);
  };

  return (
    <section className="grid gap-4 rounded-lg border border-[#423c33]/55 bg-[#fffefa] p-4 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="green">Hackathon demo</Badge>
          <Badge tone="purple">Prompt to PR</Badge>
        </div>
        <h2 className="mt-3 text-xl font-black tracking-normal text-[#312d27]">
          依頼を投入してPR候補まで見せる
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#70675b]">
          審査員にはここから見せると、AI開発の依頼、作業ブランチ、
          プレビュー、PR判断が1本の導線として伝わります。
        </p>
        <label className="mt-4 block">
          <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
            Request
          </span>
          <textarea
            className="mt-2 min-h-[112px] w-full resize-none rounded-md border border-[#c8c0b3] bg-[#fbfaf5] p-3 text-sm leading-6 text-[#312d27] outline-none transition placeholder:text-[#9a9084] focus:border-[#c95d3a] focus:ring-2 focus:ring-[#c95d3a]/20"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            aria-label="AIエージェントへのデモ依頼"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={handleSubmit}>
            依頼を投入
            <PlayCircle className="h-4 w-4" aria-hidden />
          </Button>
          <span className="text-xs leading-5 text-[#81786d]">
            実データ接続前でも、PMが確認する流れをデモできます。
          </span>
        </div>
      </div>

      <div className="rounded-md border border-[#d8d1c4] bg-[#f7f3ea] p-3">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#81786d]">
              Generated worktree
            </p>
            <p className="mt-1 font-mono text-sm font-black text-[#312d27]">
              {branchName}
            </p>
          </div>
          <Badge tone={hasSubmitted ? "green" : "slate"}>
            {hasSubmitted ? "PR候補生成済み" : "未投入"}
          </Badge>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {demoSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.label}
                className={cn(
                  "rounded-md border p-3",
                  hasSubmitted
                    ? "border-[#a8c3a6] bg-[#edf5ea]"
                    : "border-[#d8d1c4] bg-[#fffefa]",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-md border border-[#c8c0b3] bg-[#fffefa] text-[#c95d3a]">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <span className="font-mono text-[11px] font-black uppercase tracking-[0.12em] text-[#81786d]">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-3 text-sm font-black tracking-normal text-[#312d27]">
                  {step.label}
                </h3>
                <p className="mt-1 text-xs leading-5 text-[#70675b]">
                  {step.body}
                </p>
              </article>
            );
          })}
        </div>
        <div className="mt-3 rounded-md border border-[#d8d1c4] bg-[#fffefa] p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#81786d]">
            PM判断ポイント
          </p>
          <p className="mt-2 text-sm font-bold leading-6 text-[#312d27]">
            {submittedPrompt}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#70675b]">
            preview-ready / draft PR / High以上未対応0件の形で、承認か追加指示を選べる状態にします。
          </p>
        </div>
      </div>
    </section>
  );
}
