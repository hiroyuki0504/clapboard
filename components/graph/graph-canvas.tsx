import { CircleDot } from "lucide-react";
import Link from "next/link";
import type { GraphModel, GraphTone } from "@/lib/graph-model";

const toneClass: Record<GraphTone, string> = {
  project: "border-[#d66b43] text-[#9a4a31]",
  task: "border-[#423c33] text-[#312d27]",
  file: "border-[#8aa0b8] text-[#315a78]",
  minute: "border-[#b89b48] text-[#7c5a18]",
  support: "border-[#93aa8d] text-[#426c3d]",
};

export function GraphCanvas({ model }: { model: GraphModel }) {
  return (
    <div className="thin-scrollbar overflow-x-auto">
      <div className="dotted-canvas relative min-h-[520px] min-w-[680px] bg-[#fffefa]">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 520"
          role="img"
          aria-label="ワーク、タスク、議事録、ファイルの関係線"
        >
          {model.edges.map((edge) => {
            const from = model.nodeById.get(edge.from);
            const to = model.nodeById.get(edge.to);
            if (!from || !to) return null;

            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#c8c0b4"
                strokeWidth="2"
              />
            );
          })}
        </svg>

        {model.nodes.map((node) => {
          const body = (
            <div
              className={`absolute z-10 w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border bg-[#fffefa] px-3 py-2 shadow-sm ${toneClass[node.tone]}`}
              style={{
                left: `${node.x / 10}%`,
                top: `${node.y / 5.2}%`,
              }}
            >
              <div className="flex items-center gap-2">
                <CircleDot className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 truncate text-sm font-black">
                  {node.label}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-[#81786d]">{node.sub}</p>
            </div>
          );

          if (!node.href) {
            return <div key={node.id}>{body}</div>;
          }

          return (
            <Link
              key={node.id}
              href={node.href}
              aria-label={`${node.label}を開く`}
            >
              {body}
            </Link>
          );
        })}

        <div className="absolute bottom-6 left-6 max-w-xs rotate-[-1deg] rounded-sm border border-[#d2a528] bg-[#ffe783] px-4 py-3 text-sm font-bold leading-6 text-[#6f5415] shadow-sm">
          赤枠は停滞リスク。線はワーク、タスク、議事録、ファイルの参照関係です。
        </div>
      </div>
    </div>
  );
}
